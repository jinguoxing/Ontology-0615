/**
 * Batch 2 页面专用的 React Query hooks（ontology-v1 契约空间）。
 *
 * 与旧 hooks/useOntology.ts（Batch 1 适配层，服务遗留页面）区分：
 * 这里直接消费 generated types，不做旧形状投影；查询键全部经
 * ontologyKeys 的 CacheScope（workspaceId + actorId + modelId）隔离，
 * 切换演示身份或模型不会串缓存。所有读写都走真实 HTTP（Mock 服务）。
 */
import {useEffect} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {DEMO_WORKSPACE_ID, ontologyV1} from '../api/ontology-v1/client';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {newIdempotencyKey, OntologyApiError} from '../api/ontology-v1/ontologyClient';
import type {
  ActionTestRequest,
  ChangeSet,
  CreateModelRequest,
  CreateModelResult,
  EditOperation,
  Graph,
  ModelSummary,
  PublishRequest,
  ResolvedView,
  Session,
  VersionRecord,
  AuditEvent,
  ViewReference,
} from '../api/ontology-v1/types.generated';
import {useDemoIdentity} from './identity';

export type ActorScope = {workspaceId: string; actorId: string};

/** actorId 来自演示身份 store；身份切换会改变查询键，自然触发重新请求。 */
export function useActorScope(): ActorScope {
  const actor = useDemoIdentity((s) => s.actor);
  return {workspaceId: DEMO_WORKSPACE_ID, actorId: actor};
}

/**
 * 身份切换时使整个 ontology-v1 缓存失效（capabilities、视图、草稿等
 * 都随身份变化），挂在 OntologyLayout / 列表页顶层各一次。
 */
export function useInvalidateOnActorChange(): void {
  const actor = useDemoIdentity((s) => s.actor);
  const queryClient = useQueryClient();
  useEffect(() => {
    void queryClient.invalidateQueries({queryKey: ['ontology-v1']});
  }, [actor, queryClient]);
}

// ---- 读（select 投影为契约 payload，便于消费；etag 走 ResolvedView.etag 字段）----

export function useSession(scope: ActorScope) {
  return useQuery({
    queryKey: [...ontologyKeys.root(scope), 'session'],
    queryFn: ({signal}) => ontologyV1.session(),
    select: (r) => r.data,
    staleTime: 60_000,
  });
}

export function useModels(scope: ActorScope) {
  return useQuery({
    queryKey: [...ontologyKeys.root(scope), 'models'],
    queryFn: ({signal}) => ontologyV1.listModels({}, signal),
    select: (r) => r.data,
  });
}

export function useModelSummary(scope: ActorScope, modelId: string | undefined) {
  return useQuery({
    queryKey: modelId ? ontologyKeys.model({...scope, modelId}) : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.getModel(modelId!, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId),
  });
}

export function useResolvedView(scope: ActorScope, modelId: string | undefined, view: ViewReference | undefined) {
  return useQuery({
    queryKey: view && modelId
      ? ontologyKeys.view({...scope, modelId}, view)
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.getView(modelId!, view!, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && view),
  });
}

export function useGraph(scope: ActorScope, modelId: string | undefined, view: ViewReference | undefined) {
  return useQuery({
    queryKey: view && modelId
      ? [...ontologyKeys.view({...scope, modelId}, view), 'graph']
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.getGraph(modelId!, view!, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && view),
  });
}

export function useChangeSets(scope: ActorScope, modelId: string | undefined) {
  return useQuery({
    queryKey: modelId ? [...ontologyKeys.model({...scope, modelId}), 'changesets'] : ['ontology-v1', 'disabled'],
    queryFn: () => ontologyV1.listChangeSets(modelId!),
    select: (r) => r.data,
    enabled: Boolean(modelId),
  });
}

/** 单个 ChangeSet（Batch 3.5 状态带：草稿目标版本 targetVersionId 等真实登记值）。 */
export function useChangeSet(scope: ActorScope, modelId: string | undefined, changeSetId: string | null | undefined) {
  return useQuery({
    queryKey: modelId && changeSetId
      ? ontologyKeys.changeSet({...scope, modelId}, changeSetId)
      : ['ontology-v1', 'disabled'],
    queryFn: () => ontologyV1.getChangeSet(modelId!, changeSetId!),
    select: (r) => r.data,
    enabled: Boolean(modelId && changeSetId),
    staleTime: 15_000,
  });
}

export function useVersions(scope: ActorScope, modelId: string | undefined) {
  return useQuery({
    queryKey: modelId ? [...ontologyKeys.model({...scope, modelId}), 'versions'] : ['ontology-v1', 'disabled'],
    queryFn: () => ontologyV1.listVersions(modelId!),
    select: (r) => r.data,
    enabled: Boolean(modelId),
  });
}

export function useAuditEvents(scope: ActorScope, modelId: string | undefined) {
  return useQuery({
    queryKey: modelId ? [...ontologyKeys.model({...scope, modelId}), 'audit'] : ['ontology-v1', 'disabled'],
    queryFn: () => ontologyV1.audit(modelId!),
    select: (r) => r.data,
    enabled: Boolean(modelId),
  });
}

// ---- Batch 4：校验 / 影响 / 发布（异步任务 + 轮询；报告状态存于服务端与 React Query）----

/**
 * 草稿修订 diff（GET /changesets/:id/diff?revision=）。仅草稿视图有意义。
 */
export function useDiff(scope: ActorScope, modelId: string | undefined, changeSetId: string | null | undefined, revision: number | undefined) {
  return useQuery({
    queryKey: modelId && changeSetId && revision !== undefined
      ? [...ontologyKeys.model({...scope, modelId}), 'diff', changeSetId, revision]
      : ['ontology-v1', 'disabled'],
    queryFn: () => ontologyV1.diff(modelId!, changeSetId!, revision!),
    select: (r) => r.data,
    enabled: Boolean(modelId && changeSetId && revision !== undefined),
  });
}

/** 任务查询键：完整携带 workspaceId/actorId/modelId/changeSetId/revision/jobId。 */
export function jobQueryKey(scope: ActorScope, modelId: string, changeSetId: string, revision: number, jobId: string) {
  return [...ontologyKeys.model({...scope, modelId}), 'job', changeSetId, revision, jobId] as const;
}

/**
 * 异步任务轮询（GET /models/:id/jobs/:jobId）。
 * 202 的 Location/Retry-After 指向本资源；这里按固定间隔轮询，任务进入
 * 终态（SUCCEEDED / FAILED）后 refetchInterval 返回 false，停止请求。
 */
export function useJobPolling(scope: ActorScope, modelId: string | undefined, changeSetId: string | undefined, revision: number | undefined, jobId: string | undefined) {
  return useQuery({
    queryKey: modelId && changeSetId && revision !== undefined && jobId
      ? jobQueryKey(scope, modelId, changeSetId, revision, jobId)
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.getJob(modelId!, jobId!, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && changeSetId && revision !== undefined && jobId),
    refetchInterval: (query) => (query.state.data?.data.status === 'RUNNING' ? 400 : false),
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** 启动校验（POST …/validation-runs，202 + 任务）。If-Match + Idempotency-Key。 */
export function useStartValidation(scope: ActorScope, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {changeSetId: string; revision: number; etag: string}) =>
      ontologyV1.validate(modelId, input.changeSetId, input.revision, input.etag, newIdempotencyKey()),
    onSuccess: (result, variables) => {
      // 202 返回任务实体：写入任务缓存，轮询查询立即可用。
      void queryClient.setQueryData(
        jobQueryKey(scope, modelId, variables.changeSetId, variables.revision, result.data.id),
        result,
      );
    },
  });
}

/** 启动影响分析（POST …/impact-analyses，202 + 任务）。If-Match + Idempotency-Key。 */
export function useStartImpact(scope: ActorScope, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {changeSetId: string; revision: number; etag: string}) =>
      ontologyV1.analyzeImpact(modelId, input.changeSetId, input.revision, input.etag, newIdempotencyKey()),
    onSuccess: (result, variables) => {
      void queryClient.setQueryData(
        jobQueryKey(scope, modelId, variables.changeSetId, variables.revision, result.data.id),
        result,
      );
    },
  });
}

/**
 * 发布（POST …/publications，201）。服务端是最终裁决方：REPORT_STALE /
 * IMPACT_ACK_REQUIRED 等全部原样抛回页面呈现。成功后模型缓存树整体失效。
 */
export function usePublishVersion(scope: ActorScope, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {changeSetId: string; body: PublishRequest; etag: string}) =>
      ontologyV1.publish(modelId, input.changeSetId, input.body, input.etag, newIdempotencyKey()),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: ontologyKeys.model({...scope, modelId})});
      void queryClient.invalidateQueries({queryKey: [...ontologyKeys.root(scope), 'models']});
    },
  });
}

// ---- Batch 3：集合读取（GET /models/:id/{collection}，键含完整 ViewReference）----

const FULL_PAGE: {limit: number} = {limit: 200};

export function useRelations(scope: ActorScope, modelId: string | undefined, view: ViewReference | undefined) {
  return useQuery({
    queryKey: view && modelId
      ? ontologyKeys.collection({...scope, modelId}, view, 'relations', FULL_PAGE)
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.relations(modelId!, view!, FULL_PAGE, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && view),
  });
}

export function useConstraints(scope: ActorScope, modelId: string | undefined, view: ViewReference | undefined) {
  return useQuery({
    queryKey: view && modelId
      ? ontologyKeys.collection({...scope, modelId}, view, 'constraints', FULL_PAGE)
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.constraints(modelId!, view!, FULL_PAGE, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && view),
  });
}

export function useActions(scope: ActorScope, modelId: string | undefined, view: ViewReference | undefined) {
  return useQuery({
    queryKey: view && modelId
      ? ontologyKeys.collection({...scope, modelId}, view, 'actions', FULL_PAGE)
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.actions(modelId!, view!, FULL_PAGE, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && view),
  });
}

export function useImplementationBindings(scope: ActorScope, modelId: string | undefined, view: ViewReference | undefined) {
  return useQuery({
    queryKey: view && modelId
      ? ontologyKeys.collection({...scope, modelId}, view, 'implementation-bindings', FULL_PAGE)
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.implementationBindings(modelId!, view!, FULL_PAGE, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && view),
  });
}

export function useWorkflowRefs(scope: ActorScope, modelId: string | undefined, view: ViewReference | undefined) {
  return useQuery({
    queryKey: view && modelId
      ? ontologyKeys.collection({...scope, modelId}, view, 'workflow-refs', FULL_PAGE)
      : ['ontology-v1', 'disabled'],
    queryFn: ({signal}) => ontologyV1.workflowRefs(modelId!, view!, FULL_PAGE, signal),
    select: (r) => r.data,
    enabled: Boolean(modelId && view),
  });
}

// Registry / 验证用例与具体模型无关：按 workspace + actor 做会话级缓存。
export function useRegistry(scope: ActorScope) {
  return useQuery({
    queryKey: [...ontologyKeys.root(scope), 'registry'],
    queryFn: () => ontologyV1.registry(),
    select: (r) => r.data,
    staleTime: 60_000,
  });
}

export function useActionFixtures(scope: ActorScope) {
  return useQuery({
    queryKey: [...ontologyKeys.root(scope), 'action-fixtures'],
    queryFn: () => ontologyV1.actionFixtures(),
    select: (r) => r.data,
    staleTime: 60_000,
  });
}

/**
 * 行动契约验证（POST /models/:id/action-tests）。
 * 只读验证：服务端返回 realExecution=false / modelChanged=false，不产生模型修订。
 */
export function useTestAction(modelId: string) {
  return useMutation({
    mutationFn: (body: ActionTestRequest) => ontologyV1.testAction(modelId, body, newIdempotencyKey()),
  });
}

// ---- 写（全部携带 Idempotency-Key；operations 另带 If-Match）----

export function useCreateModel(scope: ActorScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateModelRequest) => ontologyV1.createModel(body, newIdempotencyKey()),
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: [...ontologyKeys.root(scope), 'models']});
    },
  });
}

export function useCreateChangeSet(scope: ActorScope, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {name: string; reason: string; baseVersionId: string | null; targetVersionId: string}) =>
      ontologyV1.createChangeSet(modelId, input, newIdempotencyKey()),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({queryKey: ontologyKeys.model({...scope, modelId})});
      void queryClient.invalidateQueries({queryKey: [...ontologyKeys.root(scope), 'models']});
      void queryClient.setQueryData(ontologyKeys.changeSet({...scope, modelId}, result.data.id), result);
    },
  });
}

/**
 * 提交 operations 到 OPEN 草稿。If-Match 使用当前 ResolvedView 的 etag
 * （服务端强校验：修订已被推进时返回 412 REVISION_CONFLICT）。
 */
export function useApplyOperations(scope: ActorScope, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {changeSetId: string; operations: EditOperation[]; etag: string}) =>
      ontologyV1.applyOperations(modelId, input.changeSetId, {operations: input.operations}, input.etag, newIdempotencyKey()),
    onSuccess: (result, variables) => {
      // 服务端返回递增后的修订；更新草稿缓存并使该模型视图树失效。
      void queryClient.setQueryData(ontologyKeys.changeSet({...scope, modelId}, variables.changeSetId), result);
      void queryClient.invalidateQueries({queryKey: ontologyKeys.model({...scope, modelId})});
    },
  });
}

// ---- 错误呈现（真实 HTTP 错误，不吞掉、不改写为假成功）----

export function isApiError(e: unknown): e is OntologyApiError {
  return e instanceof OntologyApiError;
}

export function apiErrorMessage(e: unknown): string {
  if (isApiError(e)) {
    switch (e.status) {
      case 401:
      case 403:
        return `当前演示身份没有该操作权限（${e.code}）`;
      case 404:
        return `资源不存在（${e.code}）：${e.message}`;
      case 412:
        return `草稿已被更新（${e.code}），请重新加载后再保存`;
      case 422: {
        const errors = (e.details?.errors as Array<{path?: string; message?: string}> | undefined) ?? [];
        const first = errors[0];
        return first ? `请求不符合合同（${first.path ?? ''} ${first.message ?? ''}）` : `请求不符合合同（${e.message}）`;
      }
      default:
        return `${e.message}（${e.code}）`;
    }
  }
  if (e instanceof Error && e.message === 'Failed to fetch') {
    return '无法连接 Mock API 服务（请确认 npm run dev:mock-api 已在 4310 端口启动）';
  }
  return e instanceof Error ? e.message : '未知错误';
}

/** 412 冲突时服务端会带回最新修订号，用于“载入最新修订”引导。 */
export function conflictRevision(e: unknown): number | null {
  if (isApiError(e) && e.status === 412) {
    const rev = e.details?.currentRevision;
    return typeof rev === 'number' ? rev : null;
  }
  return null;
}

export type {ChangeSet, CreateModelResult, ModelSummary, ResolvedView, Session, VersionRecord, AuditEvent, Graph};
