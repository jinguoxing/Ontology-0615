/**
 * 流程关联页（Batch 3 · 07）。
 *
 * - 读取：GET /models/:id/workflow-refs 与 GET /api/v1/ontology/registry，
 *   展示 6 个流程引用（DataSourceSetup、MetadataScan、Profiling、
 *   SemanticReview、QualityMonitoring、DataSupportResolution）的
 *   workflowId、workflowVersionId、ownerService、requiredActionIds 与兼容状态。
 * - 兼容状态：requiredActionIds 是否全部存在于当前视图的行动契约（与页面
 *   共用 compatibility.ts 的 workflowCompatibility，冒烟脚本同一实现）。
 * - 边界：本页不是 Workflow 编排器——不编辑节点、条件、重试与调度，也不提供
 *   启动 / 运行按钮；演示环境未连接实际 Runtime（Registry executable=false）。
 *   修改的仅是当前本体对流程契约的引用（UPSERT workflowRefs 进草稿）。
 */
import {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  Pencil,
  Workflow as WorkflowIcon,
  XCircle,
} from 'lucide-react';
import type {RegisteredWorkflow, WorkflowReference} from '../api/ontology-v1/types.generated';
import {useActions, useActorScope, useRegistry, useWorkflowRefs} from '../ontology/queries';
import {registryWorkflow, workflowCompatibility} from '../ontology/compatibility';
import {editPolicy} from '../ontology/editability';
import {useModelContext} from '../ontology/ModelContext';
import {
  DraftGateNotice,
  DraftTargetNote,
  FormStyles,
  InputField,
  Modal,
  useDraftWrite,
  useEnterDraft,
  WriteBanners,
} from '../ontology/draftWrite';

export default function WorkflowsPage() {
  const ctx = useModelContext();
  const {route, resolvedView, model, isDraft, selectedId, select, navigateToView, modelId, capabilities} = ctx;
  const scope = useActorScope();
  const workflowRefsQuery = useWorkflowRefs(scope, modelId, ctx.view);
  const registryQuery = useRegistry(scope);
  const actionsQuery = useActions(scope, modelId, ctx.view);

  const registry = registryQuery.data;
  const workflowRefs = workflowRefsQuery.data?.items ?? [];
  const actionIds = useMemo(() => (actionsQuery.data?.items ?? []).map((a) => a.id), [actionsQuery.data]);

  const editState = editPolicy({origin: 'LOCAL', model, view: resolvedView, capabilities});
  const editable = editState.editable;
  const draftId = isDraft && 'changeSetId' in route.view ? route.view.changeSetId : null;

  const w = useDraftWrite({scope, modelId, resolvedView, draftId, selectedId, navigateToView});
  const enter = useEnterDraft({scope, modelId, model, resolvedView, selectedId, navigateToView});

  const [editRef, setEditRef] = useState<WorkflowReference | null>(null);
  const [pickedWorkflowId, setPickedWorkflowId] = useState('');
  const [pickedVersionId, setPickedVersionId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const current = selectedId ? workflowRefs.find((r) => r.id === selectedId) : undefined;

  const rows = useMemo(() => workflowRefs.map((ref) => {
    const compat = workflowCompatibility(ref.requiredActionIds, actionIds);
    const registered = registryWorkflow(registry, ref.workflowId);
    return {ref, compat, registered};
  }), [workflowRefs, actionIds, registry]);

  const openEdit = (ref: WorkflowReference) => {
    setFormError(null);
    setEditRef(ref);
    setPickedWorkflowId(ref.workflowId);
    setPickedVersionId(ref.workflowVersionId);
  };

  const submit = () => {
    if (!editRef) return;
    setFormError(null);
    const registered = registryWorkflow(registry, pickedWorkflowId);
    if (!registered) {
      setFormError('请从 Registry 登记的流程中选择（workflowId 必须存在于 Registry）');
      return;
    }
    if (!registered.versionId || !pickedVersionId.trim()) {
      setFormError('必须固定明确的 workflowVersionId');
      return;
    }
    // 修改的仅是本体对流程契约的引用；ownerService / requiredActionIds 以 Registry 登记为准。
    const value: WorkflowReference = {
      id: editRef.id,
      workflowId: registered.id,
      workflowVersionId: pickedVersionId.trim(),
      ownerService: registered.ownerService,
      requiredActionIds: [...registered.requiredActionIds],
    };
    w.save(
      [{op: 'UPSERT', collection: 'workflowRefs', id: value.id, value}],
      `修改流程引用 ${value.id} → ${value.workflowId}@${value.workflowVersionId}`,
      {selectedId: value.id},
    );
    setEditRef(null);
  };

  if (workflowRefsQuery.isLoading || registryQuery.isLoading || actionsQuery.isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-16 flex flex-col items-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500"/>
        <p className="text-xs">正在读取 GET /models/{modelId}/workflow-refs 与 GET /registry …</p>
      </div>
    );
  }
  if (workflowRefsQuery.isError || registryQuery.isError || actionsQuery.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-2 text-[12.5px] text-red-700">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
        <p>{((workflowRefsQuery.isError ? workflowRefsQuery.error : registryQuery.isError ? registryQuery.error : actionsQuery.error) as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormStyles/>
      <WriteBanners w={w}/>
      {enter.error && (
        <p className="px-4 py-2.5 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl">{enter.error}</p>
      )}
      <DraftGateNotice reason={editState.reason} canEdit={ctx.canEdit} enter={enter}/>
      {isDraft && draftId && editable && <DraftTargetNote draftId={draftId} revision={resolvedView?.revision}/>}

      {/* 边界声明 */}
      <div className="flex items-start gap-2 px-4 py-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[12px] text-amber-800">
        <Ban className="h-4 w-4 shrink-0 mt-0.5"/>
        <p>
          本页不是 Workflow 编排器：不编辑流程节点、条件、重试与调度，也不提供启动或运行按钮。
          <b>演示环境未连接实际 Runtime</b>（Registry 中所有流程 executable=false）。
          修改的仅是当前本体对流程契约的引用（workflowId + workflowVersionId）。
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-[13px] font-bold text-slate-700">
              流程引用 <span className="font-mono text-slate-400">({workflowRefs.length})</span>
              <span className="ml-2 text-[10.5px] font-normal text-slate-400">GET /models/{modelId}/workflow-refs</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map(({ref, compat, registered}) => {
              const active = ref.id === selectedId;
              return (
                <div
                  key={ref.id}
                  onClick={() => select(ref.id)}
                  className={`px-4 py-3.5 cursor-pointer transition-colors ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <WorkflowIcon className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
                        <span className="text-[13px] font-bold text-slate-800">{registered?.nameCn ?? ref.workflowId}</span>
                        <span className="font-mono text-[10px] text-slate-400">{ref.workflowId}@{ref.workflowVersionId}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Owner <span className="font-mono">{ref.ownerService}</span>
                        {!registered && <span className="ml-2 text-amber-600 font-bold">Registry 未登记该流程</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {compat.ok
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3"/>兼容（所需行动齐备）
                          </span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3"/>不兼容（缺 {compat.missing.length} 个行动）
                          </span>}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        executable={registered ? String(registered.executable) : '?'}
                      </span>
                      {editable && (
                        <button
                          onClick={(e) => {e.stopPropagation(); select(ref.id); openEdit(ref);}}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                        ><Pencil className="h-3 w-3"/>改引用</button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center flex-wrap gap-1.5">
                    <span className="text-[10.5px] text-slate-400 font-semibold">所需行动（{ref.requiredActionIds.length}）</span>
                    {ref.requiredActionIds.map((aid) => {
                      const has = actionIds.includes(aid);
                      return (
                        <span
                          key={aid}
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono border ${
                            has ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200 line-through'
                          }`}
                        >{aid}</span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {workflowRefs.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-slate-400">当前视图没有流程引用</p>
            )}
          </div>
        </div>

        {/* Inspector */}
        <aside className="w-full xl:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          {!current ? (
            <div className="py-12 text-center space-y-2">
              <WorkflowIcon className="h-6 w-6 text-slate-200 mx-auto"/>
              <p className="text-xs text-slate-400">在左侧选择一个流程引用</p>
            </div>
          ) : (
            <WorkflowInspector
              ref_={current}
              registered={registryWorkflow(registry, current.workflowId)}
              compat={workflowCompatibility(current.requiredActionIds, actionIds)}
              editable={editable}
              onEdit={() => openEdit(current)}
            />
          )}
        </aside>
      </div>

      {editRef && (
        <Modal
          title={`修改流程引用 ${editRef.id}`}
          subtitle="只切换本体引用的流程契约（workflowId + workflowVersionId，来自 Registry 登记）。ownerService 与 requiredActionIds 以 Registry 为准，不可在本页编排。"
          onClose={() => setEditRef(null)}
        >
          <div className="space-y-3">
            <InputField label="Registry 登记流程" hint={`共 ${registry?.workflows.length ?? 0} 个登记流程，全部 executable=false（未连接实际 Runtime）`}>
              <select
                value={pickedWorkflowId}
                onChange={(e) => {
                  const picked = registryWorkflow(registry, e.target.value);
                  setPickedWorkflowId(e.target.value);
                  setPickedVersionId(picked?.versionId ?? '');
                }}
                className="input"
              >
                <option value="">— 选择流程 —</option>
                {(registry?.workflows ?? []).map((wf) => (
                  <option key={wf.id} value={wf.id}>{wf.nameCn}（{wf.id}）</option>
                ))}
              </select>
            </InputField>
            {(() => {
              const picked = registryWorkflow(registry, pickedWorkflowId);
              return picked ? (
                <div className="space-y-2 text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
                  <p className="font-bold text-slate-700">{picked.nameCn}</p>
                  <p>{picked.description}</p>
                  <p className="font-mono text-[10.5px] text-slate-500">Registry 版本 {picked.versionId} · Owner {picked.ownerService} · executable {String(picked.executable)}</p>
                  <p className="font-mono text-[10.5px] text-slate-400 break-all">所需行动 {picked.requiredActionIds.join(' | ')}</p>
                </div>
              ) : null;
            })()}
            <InputField label="workflowVersionId" hint="必须固定明确版本（默认取 Registry 登记版本）">
              <input value={pickedVersionId} onChange={(e) => setPickedVersionId(e.target.value)} className="input font-mono"/>
            </InputField>
            {formError && <p className="text-[11.5px] text-red-600">{formError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setEditRef(null)} className="btn-ghost">取消</button>
            <button onClick={submit} disabled={w.saving} className="btn-primary">
              {w.saving && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}保存引用
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function WorkflowInspector({ref_, registered, compat, editable, onEdit}: {
  ref_: WorkflowReference;
  registered: RegisteredWorkflow | undefined;
  compat: ReturnType<typeof workflowCompatibility>;
  editable: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">{registered?.nameCn ?? ref_.workflowId}</h3>
          <p className="font-mono text-[10px] text-slate-400 mt-0.5">{ref_.id}</p>
        </div>
        {compat.ok
          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">兼容</span>
          : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 shrink-0">不兼容</span>}
      </div>
      <div className="space-y-2 text-[12px]">
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">workflowId</span>
          <span className="font-mono text-slate-600 text-right break-all">{ref_.workflowId}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">workflowVersionId</span>
          <span className="font-mono text-slate-600 text-right break-all">{ref_.workflowVersionId}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">ownerService</span>
          <span className="font-mono text-slate-600 text-right">{ref_.ownerService}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-slate-600">requiredActionIds（{ref_.requiredActionIds.length}）</p>
        {ref_.requiredActionIds.map((aid) => (
          <p key={aid} className={`text-[10.5px] font-mono ${compat.missing.includes(aid) ? 'text-red-600' : 'text-slate-500'}`}>
            {compat.missing.includes(aid) ? '✗' : '✓'} {aid}
          </p>
        ))}
      </div>
      {registered && (
        <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">{registered.description}</p>
      )}
      {registered && !registered.executable && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          演示环境未连接实际 Runtime（Registry executable=false）：本页不提供启动或运行入口。
        </p>
      )}
      {editable && (
        <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
          <Pencil className="h-3.5 w-3.5"/>修改引用
        </button>
      )}
    </div>
  );
}
