/**
 * Batch 3 四个页面（关系/行动/实现绑定/流程关联）共享的草稿写入机制与 UI。
 *
 * useDraftWrite 封装 POST /changesets/:id/operations 的完整链路：
 * - If-Match（当前 ResolvedView etag）+ Idempotency-Key；
 * - 成功后把 URL revision replace 成服务端返回的新修订号（tab 保持不变）；
 * - 412 REVISION_CONFLICT 保留用户输入，提供“载入最新修订”入口；
 * - 403 / 422 / 断网错误原样呈现（apiErrorMessage），不回退静态数据。
 *
 * useEnterDraft 处理“正式版本 → 进入草稿”：优先继续服务端声明的
 * activeChangeSetId，否则从当前正式版本创建新草稿（409 时由服务端兜底，
 * UI 从不静默选择列表中的第一个草稿）。
 */
import {useState, type ReactNode} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {AlertTriangle, CheckCircle2, Eye, FileClock, Loader2, Lock, RefreshCw, X} from 'lucide-react';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {ontologyV1} from '../api/ontology-v1/client';
import type {EditOperation, ModelSummary, ResolvedView, ViewReference} from '../api/ontology-v1/types.generated';
import {
  apiErrorMessage,
  useApplyOperations,
  useCreateChangeSet,
  type ActorScope,
} from './queries';
import {SERVER_GUARD, type EditDenyReason} from './editability';

export type WriteBanner = {kind: 'success' | 'error'; text: string} | null;

export interface DraftWrite {
  /** 提交 operations；opts.selectedId=null 表示保存后清空选中，undefined 保持当前选中。 */
  save: (operations: EditOperation[], note: string, opts?: {selectedId?: string | null}) => void;
  saving: boolean;
  banner: WriteBanner;
  setBanner: (b: WriteBanner) => void;
  conflict: {serverRevision: number} | null;
  loadLatestRevision: () => void;
}

export function useDraftWrite(input: {
  scope: ActorScope;
  modelId: string;
  resolvedView: ResolvedView | undefined;
  draftId: string | null;
  selectedId: string | undefined;
  navigateToView: (view: ViewReference, opts?: {selectedId?: string; replace?: boolean}) => void;
}): DraftWrite {
  const applyOps = useApplyOperations(input.scope, input.modelId);
  const [banner, setBanner] = useState<WriteBanner>(null);
  const [conflict, setConflict] = useState<{serverRevision: number} | null>(null);

  const save: DraftWrite['save'] = (operations, note, opts) => {
    if (!input.draftId || !input.resolvedView) return;
    setBanner(null);
    setConflict(null);
    applyOps.mutate(
      {
        changeSetId: input.draftId,
        operations,
        etag: input.resolvedView.etag,
      },
      {
        onSuccess: (cs) => {
          setBanner({kind: 'success', text: `${note} 已提交到草稿 ${cs.data.id} r${cs.data.revision}`});
          // URL revision 更新为服务端返回值；tab 由 ModelContext 保持。
          const nextSelected = opts && 'selectedId' in opts ? opts.selectedId : input.selectedId;
          input.navigateToView(
            {changeSetId: cs.data.id, revision: cs.data.revision},
            {selectedId: nextSelected ?? undefined, replace: true},
          );
        },
        onError: (e) => {
          const rev = conflictRevisionOf(e);
          if (rev !== null) setConflict({serverRevision: rev});
          else setBanner({kind: 'error', text: apiErrorMessage(e)});
        },
      },
    );
  };

  const loadLatestRevision = () => {
    if (!conflict || !input.draftId) return;
    setConflict(null);
    setBanner(null);
    input.navigateToView(
      {changeSetId: input.draftId, revision: conflict.serverRevision},
      {selectedId: input.selectedId, replace: true},
    );
  };

  return {save, saving: applyOps.isPending, banner, setBanner, conflict, loadLatestRevision};
}

function conflictRevisionOf(e: unknown): number | null {
  if (e && typeof e === 'object' && 'status' in e && (e as {status: number}).status === 412) {
    const details = (e as {details?: Record<string, unknown>}).details;
    const rev = details?.currentRevision;
    return typeof rev === 'number' ? rev : null;
  }
  return null;
}

/** 正式版本 → 草稿 的统一入口（继续 activeChangeSetId 或从版本新建）。 */
export function useEnterDraft(input: {
  scope: ActorScope;
  modelId: string;
  model: ModelSummary | undefined;
  resolvedView: ResolvedView | undefined;
  selectedId: string | undefined;
  navigateToView: (view: ViewReference, opts?: {selectedId?: string}) => void;
}) {
  const queryClient = useQueryClient();
  const createChangeSet = useCreateChangeSet(input.scope, input.modelId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goDraft = () => {
    const csId = input.model?.activeChangeSetId;
    if (!csId) return;
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const cs = await queryClient.fetchQuery({
          queryKey: ontologyKeys.changeSet({...input.scope, modelId: input.modelId}, csId),
          queryFn: () => ontologyV1.getChangeSet(input.modelId, csId),
          staleTime: 15_000,
        });
        input.navigateToView({changeSetId: cs.data.id, revision: cs.data.revision}, {selectedId: input.selectedId});
      } catch (e) {
        setError(apiErrorMessage(e));
      } finally {
        setBusy(false);
      }
    })();
  };

  const createDraftFromVersion = () => {
    const baseVersionId = input.resolvedView?.versionId ?? null;
    const m = baseVersionId?.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    const target = m ? `v${m[1]}.${Number(m[2]) + 1}.${m[3]}` : 'v1.0.0';
    createChangeSet.mutate(
      {
        name: `从 ${baseVersionId ?? '当前版本'} 创建的变更`,
        reason: 'Batch 3 页面：从正式版本进入编辑',
        baseVersionId,
        targetVersionId: target,
      },
      {
        onSuccess: (cs) => input.navigateToView(
          {changeSetId: cs.data.id, revision: cs.data.revision},
          {selectedId: input.selectedId},
        ),
        onError: (e) => setError(apiErrorMessage(e)),
      },
    );
  };

  return {
    hasDraft: Boolean(input.model?.activeChangeSetId),
    goDraft,
    createDraftFromVersion,
    busy,
    pending: createChangeSet.isPending,
    error,
  };
}

/** 成功/失败 + 412 冲突横幅（各页共用一份实现）。 */
export function WriteBanners({w}: {w: DraftWrite}) {
  return (
    <>
      {w.conflict && (
        <div className="flex items-start gap-2 px-4 py-3 bg-orange-50 border border-orange-300 rounded-xl text-[12.5px] text-orange-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
          <div className="flex-1">
            <p className="font-bold">保存冲突（草稿已被他人更新）</p>
            <p className="mt-0.5">
              草稿已被更新到 <strong>r{w.conflict.serverRevision}</strong>，本次提交未生效。
              你的修改仍保留在表单中；可载入最新修订后重试。
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={w.loadLatestRevision}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <RefreshCw className="h-3 w-3"/>载入最新修订
            </button>
            <button onClick={() => w.setBanner(null)} className="text-orange-500 hover:text-orange-700"><X className="h-4 w-4"/></button>
          </div>
        </div>
      )}
      {w.banner && (
        <div className={`flex items-start gap-2 px-4 py-3 border rounded-xl text-[12.5px] ${
          w.banner.kind === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {w.banner.kind === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5"/>
            : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>}
          <p className="flex-1">{w.banner.text}</p>
          <button onClick={() => w.setBanner(null)} className="shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4"/></button>
        </div>
      )}
    </>
  );
}

/** 只读原因说明（正式版本 / viewer 权限），文字与服务端裁决一致。 */
export function DraftGateNotice({reason, canEdit, enter}: {
  reason: EditDenyReason | null;
  canEdit: boolean;
  enter: ReturnType<typeof useEnterDraft>;
}) {
  // 只解释两种只读原因；loading / external-reference 由调用方另行处理。
  if (reason !== 'published-version' && reason !== 'viewer-permission') return null;
  if (reason === 'published-version') {
    return (
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-700">
        <Lock className="h-4 w-4 shrink-0 mt-0.5 text-slate-500"/>
        <div className="flex-1">
          <p className="font-bold">正在查看已发布正式版本（只读）</p>
          <p className="mt-0.5 text-slate-500">{SERVER_GUARD['published-version']}。</p>
        </div>
        {canEdit && (
          <div className="shrink-0">
            {enter.hasDraft ? (
              <button onClick={enter.goDraft} disabled={enter.busy} className="btn-primary">
                {enter.busy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}继续草稿
              </button>
            ) : (
              <button onClick={enter.createDraftFromVersion} disabled={enter.pending} className="btn-primary">
                {enter.pending && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}创建变更草稿
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-700">
      <Eye className="h-4 w-4 shrink-0 mt-0.5 text-slate-500"/>
      <p>
        当前演示身份仅具备只读权限；{SERVER_GUARD['viewer-permission']}。可在右上角切换为维护人员身份后编辑。
      </p>
    </div>
  );
}

/** 草稿上下文提示条（当前写入目标）。 */
export function DraftTargetNote({draftId, revision}: {draftId: string; revision: number | undefined}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-[12px] text-blue-800">
      <FileClock className="h-3.5 w-3.5 shrink-0"/>
      <p>
        修改将提交到当前草稿 <span className="font-mono font-bold">{draftId}</span>
        {revision !== undefined && <> · r<span className="font-mono font-bold">{revision}</span></>}
        。草稿需经校验与发布才会成为正式版本。
      </p>
    </div>
  );
}

export function Modal({title, subtitle, onClose, children}: {title: string; subtitle?: string; onClose: () => void; children: ReactNode}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-5 space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * 右侧滑出抽屉（Batch 3.5）：次级信息的容器——验证用例、全部约束、
 * 技术详情等不占据主区域的入口。与 Modal 同为展示层，不改变写入链路。
 */
export function Drawer({title, subtitle, onClose, children, width = 'max-w-xl'}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/25 flex justify-end" onClick={onClose}>
      <div
        className={`bg-white h-full w-full ${width} flex flex-col border-l border-slate-200 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0"><X className="h-4 w-4"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function InputField({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}

/** Batch 3 四页共用的表单/按钮样式（各页顶层渲染一次）。 */
export function FormStyles() {
  return (
    <style>{`
      .input { width: 100%; padding: 6px 10px; font-size: 12px; border: 1px solid rgb(226 232 240); border-radius: 8px; outline: none; background: white; }
      .input:focus { border-color: rgb(59 130 246); }
      .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: white; background: rgb(37 99 235); border-radius: 8px; }
      .btn-primary:hover { background: rgb(29 78 216); }
      .btn-primary:disabled { opacity: 0.6; }
      .btn-ghost { padding: 6px 12px; font-size: 12px; font-weight: 700; color: rgb(71 85 105); background: rgb(241 245 249); border-radius: 8px; }
      .btn-ghost:hover { background: rgb(226 232 240); }
    `}</style>
  );
}
