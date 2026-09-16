/**
 * 模型主操作（Batch 4.6 第一节 / 第二节）。
 *
 * 系统模型与业务本体统一的状态动作：按 ModelSummary 的服务端状态推导唯一
 * 主操作，消除「显示继续建模但没有草稿可进」的无效状态：
 * - activeChangeSetId 存在 → 继续草稿（读取草稿最新修订后进入对象类型页）；
 * - currentVersionId 存在 → 创建变更（点击后通知宿主展开变更表单，提交仍走
 *   POST /models/:id/changesets，基于当前正式版本）；
 * - 两者都不存在 → 重新开始建模：创建初始 ChangeSet
 *   （baseVersionId=null，targetVersionId=v1.0.0）后进入对象类型页。
 *
 * canEdit=false 时创建类操作降级为权限提示（服务端仍是最终权衡，403）。
 * 变更表单（CreateChangeSetForm）同时供表格行与系统模型区域复用，
 * 默认变更说明为产品语言，不再携带批次等工程字样。
 */
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {Hammer, Loader2, Plus} from 'lucide-react';
import {ontologyLocation} from '../api/ontology-v1/routeContext';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {ontologyV1} from '../api/ontology-v1/client';
import type {ModelSummary} from '../api/ontology-v1/types.generated';
import {apiErrorMessage, useActorScope, useCreateChangeSet} from '../ontology/queries';
import {nextTargetVersion} from './OntologyModelsTable';

export type ModelActionState = 'continue-draft' | 'create-change' | 'create-initial-draft';

/** 由服务端状态（而非 UI 推测）推导唯一主操作。 */
export function modelActionState(model: ModelSummary): ModelActionState {
  if (model.activeChangeSetId) return 'continue-draft';
  if (model.currentVersionId) return 'create-change';
  return 'create-initial-draft';
}

/** 初始草稿的登记参数（Batch 4.6 第二节）。 */
const INITIAL_DRAFT = {
  name: '初始业务建模',
  reason: '创建业务本体初始定义',
  baseVersionId: null,
  targetVersionId: 'v1.0.0',
} as const;

/** 列表页创建变更的默认说明（产品语言；用户填写时优先生效）。 */
const LIST_CHANGE_REASON = '从业务本体列表创建变更';

export default function ModelPrimaryAction({model, canEdit, onRequestCreateChange}: {
  model: ModelSummary;
  canEdit: boolean;
  /** 「创建变更」点击回调：宿主自行渲染变更表单（表格行内展开 / 区域内展开）。 */
  onRequestCreateChange?: () => void;
}) {
  const actorScope = useActorScope();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createChangeSet = useCreateChangeSet(actorScope, model.id);
  const [draftBusy, setDraftBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = modelActionState(model);

  /** 读取草稿最新修订后进入对象类型页（与状态带「继续草稿」同一路径）。 */
  const goDraft = async () => {
    if (!model.activeChangeSetId) return;
    setDraftBusy(true);
    setError(null);
    try {
      const cs = await queryClient.fetchQuery({
        queryKey: ontologyKeys.changeSet({...actorScope, modelId: model.id}, model.activeChangeSetId),
        queryFn: () => ontologyV1.getChangeSet(model.id, model.activeChangeSetId!),
        staleTime: 15_000,
      });
      navigate(ontologyLocation({
        modelId: model.id,
        tab: 'object-types',
        view: {changeSetId: cs.data.id, revision: cs.data.revision},
      }));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setDraftBusy(false);
    }
  };

  /** 无正式版本且无活动草稿：创建初始 ChangeSet 后进入对象类型页。 */
  const createInitialDraft = () => {
    setError(null);
    createChangeSet.mutate(
      {
        name: INITIAL_DRAFT.name,
        reason: INITIAL_DRAFT.reason,
        baseVersionId: INITIAL_DRAFT.baseVersionId,
        targetVersionId: INITIAL_DRAFT.targetVersionId,
      },
      {
        onSuccess: (cs) => {
          navigate(ontologyLocation({
            modelId: model.id,
            tab: 'object-types',
            view: {changeSetId: cs.data.id, revision: cs.data.revision},
          }));
        },
        onError: (e) => setError(apiErrorMessage(e)),
      },
    );
  };

  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap" data-testid="model-primary-action">
      {state === 'continue-draft' ? (
        <button onClick={() => void goDraft()} disabled={draftBusy} className="semovix-btn-primary" title="读取草稿最新修订后继续编辑">
          {draftBusy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}继续草稿
        </button>
      ) : state === 'create-change' ? (
        canEdit ? (
          <button onClick={onRequestCreateChange} className="semovix-btn-primary" title="基于当前正式版本创建变更草稿">
            <Plus className="h-3.5 w-3.5"/>创建变更
          </button>
        ) : (
          <span className="text-[12px] text-slate-400" title="当前演示身份为只读">创建变更（需编辑权限）</span>
        )
      ) : (
        canEdit ? (
          <button
            onClick={createInitialDraft}
            disabled={createChangeSet.isPending}
            className="semovix-btn-primary"
            title="尚无正式版本与草稿：创建初始草稿后开始建模"
          >
            {createChangeSet.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}
            <Hammer className="h-3.5 w-3.5"/>重新开始建模
          </button>
        ) : (
          <span className="text-[12px] text-slate-400" title="当前演示身份为只读">重新开始建模（需编辑权限）</span>
        )
      )}
      {error && <span className="text-[12px] text-red-600" data-testid="model-action-error">{error}</span>}
    </span>
  );
}

/**
 * 创建变更表单（宿主负责容器：表格行内展开 tr / 系统模型区域内展开块）。
 * 提交走 POST /models/:id/changesets；成功后进入新草稿的对象类型页。
 */
export function CreateChangeSetForm({model, onDone}: {model: ModelSummary; onDone: () => void}) {
  const actorScope = useActorScope();
  const navigate = useNavigate();
  const createChangeSet = useCreateChangeSet(actorScope, model.id);
  const [form, setForm] = useState({name: '', reason: ''});
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!form.name.trim()) {
      setError('请填写变更名称');
      return;
    }
    createChangeSet.mutate(
      {
        name: form.name.trim(),
        reason: form.reason.trim() || `${form.name.trim()}（${LIST_CHANGE_REASON}）`,
        baseVersionId: model.currentVersionId,
        targetVersionId: nextTargetVersion(model.currentVersionId),
      },
      {
        onSuccess: (cs) => {
          navigate(ontologyLocation({
            modelId: model.id,
            tab: 'object-types',
            view: {changeSetId: cs.data.id, revision: cs.data.revision},
          }));
        },
        onError: (e) => setError(apiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="px-1 py-2 space-y-2" data-testid="create-changeset-form">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
          placeholder="变更名称，例如：新增供应商对象"
          className="flex-1 min-w-56 px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <input
          value={form.reason}
          onChange={(e) => setForm((f) => ({...f, reason: e.target.value}))}
          placeholder="变更说明（可空，将使用默认说明）"
          className="flex-1 min-w-56 px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
      <p className="text-[12px] text-slate-400">
        基于 {model.currentVersionId ?? '（无正式版本）'} → 目标 {nextTargetVersion(model.currentVersionId)}
      </p>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={createChangeSet.isPending} className="semovix-btn-primary">
          {createChangeSet.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}创建并进入草稿
        </button>
        <button onClick={onDone} className="semovix-btn-outline">收起</button>
      </div>
    </div>
  );
}
