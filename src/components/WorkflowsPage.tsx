/**
 * 流程关联页（Batch 3 · 07；Batch 3.5 三栏结构对齐）。
 *
 * - 读取：GET /models/:id/workflow-refs 与 GET /api/v1/ontology/registry。
 * - 三栏：左 = 流程引用选择；中 = 当前选中流程的只读步骤预览
 *   （Registry 未登记节点编排，步骤由 requiredActionIds 顺序推导，只读）；
 *   右 = 引用 Inspector。
 * - 下方汇总当前流程的依赖：所需对象（所需行动的输入 ∪ 产出类型）、
 *   所需行动（在当前视图是否存在）、实现绑定（按 actionId 解析 + 产品文案）。
 * - 兼容状态：requiredActionIds 是否全部存在于当前视图的行动契约（与页面
 *   共用 compatibility.ts 的 workflowCompatibility，冒烟脚本同一实现）。
 * - 边界：本页不是 Workflow 编排器——不编辑节点、条件、重试与调度，也不提供
 *   启动 / 运行按钮；发布本体不等于启动流程。演示环境未连接实际 Runtime
 *   （Registry executable=false）。修改的仅是当前本体对流程契约的引用
 *   （UPSERT workflowRefs 进草稿）。
 */
import {useMemo, useState} from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDot,
  Loader2,
  Pencil,
  Workflow as WorkflowIcon,
  XCircle,
} from 'lucide-react';
import type {ActionContract, ObjectTypeDefinition, RegisteredWorkflow, WorkflowReference} from '../api/ontology-v1/types.generated';
import {
  useActions,
  useActorScope,
  useImplementationBindings,
  useRegistry,
  useWorkflowRefs,
} from '../ontology/queries';
import {registryWorkflow, resolveBinding, workflowCompatibility} from '../ontology/compatibility';
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
  const bindingsQuery = useImplementationBindings(scope, modelId, ctx.view);

  const registry = registryQuery.data;
  const workflowRefs = workflowRefsQuery.data?.items ?? [];
  const actions = useMemo(() => actionsQuery.data?.items ?? [], [actionsQuery.data]);
  const actionById = useMemo(() => new Map(actions.map((a) => [a.id, a])), [actions]);
  const bindings = bindingsQuery.data?.items ?? [];
  const types = useMemo(() => resolvedView?.document.objectTypes ?? [], [resolvedView]);
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

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
  const currentRegistered = current ? registryWorkflow(registry, current.workflowId) : undefined;
  const currentCompat = useMemo(
    () => (current ? workflowCompatibility(current.requiredActionIds, actions.map((a) => a.id)) : undefined),
    [current, actions],
  );

  // 所需对象 = 所需行动的输入 ∪ 产出对象类型（按出现顺序去重）。
  const currentRequiredTypes = useMemo(() => {
    if (!current) return [] as Array<ObjectTypeDefinition | undefined>;
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const aid of current.requiredActionIds) {
      const action = actionById.get(aid);
      if (!action) continue;
      for (const tid of [...action.inputTypeIds, ...action.outputTypeIds]) {
        if (!seen.has(tid)) {seen.add(tid); ids.push(tid);}
      }
    }
    return ids.map((id) => typeById.get(id));
  }, [current, actionById, typeById]);

  // 所需行动的实现绑定（按 actionId 分组）。
  const currentBindingsByAction = useMemo(() => {
    if (!current) return [] as Array<{actionId: string; action: ActionContract | undefined; bindings: typeof bindings}>;
    const relevant = bindings.filter((b) => b.actionId && current.requiredActionIds.includes(b.actionId));
    const grouped = new Map<string, typeof bindings>();
    for (const b of relevant) {
      const list = grouped.get(b.actionId!) ?? [];
      list.push(b);
      grouped.set(b.actionId!, list);
    }
    // 保持 requiredActionIds 顺序（缺失行动也显示）。
    return current.requiredActionIds.map((aid) => ({
      actionId: aid,
      action: actionById.get(aid),
      bindings: grouped.get(aid) ?? [],
    }));
  }, [current, bindings, actionById]);

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
      setFormError('请从登记流程中选择');
      return;
    }
    if (!registered.versionId || !pickedVersionId.trim()) {
      setFormError('必须固定明确的流程版本');
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
        <p className="text-xs">正在读取流程引用…</p>
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
          <b>发布本体不等于启动流程</b>；<b>演示环境未连接实际流程运行时</b>。
          修改的仅是当前本体对流程契约的引用（workflowId + workflowVersionId）。
        </p>
      </div>

      {/* 三栏：左选择 · 中步骤预览 · 右 Inspector */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* 左：流程引用选择 */}
        <aside className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden self-stretch">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-[13px] font-bold text-slate-700">
              流程引用 <span className="font-mono text-slate-400">({workflowRefs.length})</span>
            </h2>
            <p className="text-[10.5px] text-slate-400 mt-0.5">与登记信息对照 · 点击选择流程</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {workflowRefs.map((ref) => {
              const registered = registryWorkflow(registry, ref.workflowId);
              const compat = workflowCompatibility(ref.requiredActionIds, actions.map((a) => a.id));
              const active = ref.id === selectedId;
              return (
                <button
                  key={ref.id}
                  onClick={() => select(ref.id)}
                  className={`w-full text-left px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <WorkflowIcon className="h-3.5 w-3.5 text-slate-400 shrink-0"/>
                        <span className={`text-[12.5px] font-bold truncate ${active ? 'text-blue-800' : 'text-slate-800'}`}>
                          {registered?.nameCn ?? ref.workflowId}
                        </span>
                      </div>
                      <p className="font-mono text-[9.5px] text-slate-400 mt-0.5 truncate">{ref.workflowId}@{ref.workflowVersionId}</p>
                    </div>
                    {compat.ok
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0"/>
                      : <XCircle className="h-4 w-4 text-red-500 shrink-0"/>}
                  </div>
                  {!registered && <p className="text-[10px] text-amber-600 font-bold mt-1">登记信息中未登记该流程</p>}
                </button>
              );
            })}
            {workflowRefs.length === 0 && (
              <p className="px-4 py-10 text-center text-xs text-slate-400">当前视图没有流程引用</p>
            )}
          </div>
        </aside>

        {/* 中：只读步骤预览 */}
        {!current ? (
          <div className="flex-1 bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center text-xs text-slate-400">
            在左侧选择一个流程引用{selectedId && <>（所选流程不存在于当前视图）</>}
          </div>
        ) : (
          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-800">{currentRegistered?.nameCn ?? current.workflowId}</h2>
                <p className="text-[11px] text-slate-500">
                  只读步骤预览 · 责任服务 <span className="font-mono">{current.ownerService}</span>
                  <span className="ml-2 font-mono text-[10px] text-slate-400">{current.workflowId}@{current.workflowVersionId}</span>
                </p>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-[11.5px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                  登记信息未包含节点编排；下方步骤由流程声明的所需行动顺序推导，<b>只读</b>，不代表真实运行时的执行图。
                </p>
                <ol className="space-y-2">
                  {current.requiredActionIds.map((aid, i) => {
                    const action = actionById.get(aid);
                    return (
                      <li key={aid} className="flex items-start gap-3">
                        <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center font-mono">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[12.5px] font-bold text-slate-700">{action?.nameCn ?? aid}</span>
                            {action
                              ? <span className="px-1.5 py-0.5 rounded border text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">行动契约存在</span>
                              : <span className="px-1.5 py-0.5 rounded border text-[9.5px] font-bold bg-red-50 text-red-700 border-red-200">当前视图缺失</span>}
                          </div>
                          <p className="font-mono text-[9.5px] text-slate-400 mt-0.5">{aid}{action ? ` · ${action.ownerService}` : ''}</p>
                          {action && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{action.definition}</p>}
                        </div>
                      </li>
                    );
                  })}
                  {current.requiredActionIds.length === 0 && (
                    <p className="text-[11.5px] text-slate-400">该流程引用未声明所需行动。</p>
                  )}
                </ol>
                {currentRegistered && (
                  <p className="text-[12px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{currentRegistered.description}</p>
                )}
                {currentRegistered && !currentRegistered.executable && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    演示环境未连接实际流程运行时：本页不提供启动或运行入口；发布本体也不会启动该流程。
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 右：引用 Inspector */}
        <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-3 self-stretch">
          {!current || !currentCompat ? (
            <div className="py-12 text-center space-y-2">
              <WorkflowIcon className="h-6 w-6 text-slate-200 mx-auto"/>
              <p className="text-xs text-slate-400">在左侧选择一个流程引用</p>
            </div>
          ) : (
            <WorkflowInspector
              ref_={current}
              registered={currentRegistered}
              compat={currentCompat}
              editable={editable}
              onEdit={() => openEdit(current)}
            />
          )}
        </aside>
      </div>

      {/* 下方：当前流程的依赖汇总（所需对象 / 所需行动 / 实现绑定） */}
      {current && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* 所需对象 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[12.5px] font-bold text-slate-700">
                所需对象 <span className="font-mono text-slate-400">({currentRequiredTypes.length})</span>
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">所需行动的输入 ∪ 产出对象类型</p>
            </div>
            <div className="p-4 space-y-1.5">
              {currentRequiredTypes.length === 0
                ? <p className="text-[11.5px] text-slate-400">未推导出所需对象（所需行动为空或均缺失）。</p>
                : currentRequiredTypes.map((t, i) => (
                  <p key={`${t?.id ?? 'missing'}-${i}`} className="text-[11.5px] text-slate-600">
                    {t?.nameCn ?? '（当前视图缺失）'}
                    <span className="ml-1.5 font-mono text-[9.5px] text-slate-400">{t?.id}</span>
                    {t?.origin === 'EXTERNAL' && <span className="ml-1 text-[9.5px] text-amber-600">外部引用</span>}
                  </p>
                ))}
            </div>
          </div>

          {/* 所需行动 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[12.5px] font-bold text-slate-700">
                所需行动 <span className="font-mono text-slate-400">({current.requiredActionIds.length})</span>
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">所需行动是否存在于当前视图</p>
            </div>
            <div className="p-4 space-y-1.5">
              {current.requiredActionIds.map((aid) => {
                const has = actionById.has(aid);
                return (
                  <p key={aid} className={`text-[11.5px] font-mono flex items-center gap-1.5 ${has ? 'text-slate-600' : 'text-red-600 line-through'}`}>
                    <span className={has ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{has ? '✓' : '✗'}</span>
                    {aid}
                  </p>
                );
              })}
              {current.requiredActionIds.length === 0 && <p className="text-[11.5px] text-slate-400">无所需行动。</p>}
            </div>
          </div>

          {/* 实现绑定 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-[12.5px] font-bold text-slate-700">
                实现绑定 <span className="font-mono text-slate-400">({currentBindingsByAction.reduce((n, g) => n + g.bindings.length, 0)})</span>
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5">按所需行动的 actionId 解析当前视图绑定</p>
            </div>
            <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
              {currentBindingsByAction.length === 0 && <p className="text-[11.5px] text-slate-400">该流程没有所需行动。</p>}
              {currentBindingsByAction.map(({actionId, bindings: groupBindings}) => (
                <div key={actionId} className="space-y-1">
                  <p className="font-mono text-[10px] text-slate-400">{actionId}</p>
                  {groupBindings.length === 0
                    ? <p className="text-[11px] text-slate-400">· 未绑定实现（见「实现绑定」页）</p>
                    : groupBindings.map((b) => {
                      const r = resolveBinding(b, registry);
                      return (
                        <div key={b.id} className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[9.5px] text-slate-500 truncate">{b.id}</span>
                            {r.issues.length === 0
                              ? <span className="text-emerald-600 font-bold text-[10px]">✓ 已解决</span>
                              : <span className="text-amber-600 font-bold text-[10px]">✗ 未解决</span>}
                          </div>
                          {r.implementation && (
                            <p className="text-[9.5px] text-slate-400">
                              {r.implementation.transport === 'MOCK' ? '当前使用演示实现' : r.implementation.transport}
                              {!r.implementation.liveEndpointVerified && ' · 生产端点尚未验证'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editRef && (
        <Modal
          title={`修改流程引用 ${editRef.id}`}
          subtitle="只切换本体引用的流程契约（流程与版本来自登记信息）。责任服务与所需行动以登记信息为准，不可在本页编排。"
          onClose={() => setEditRef(null)}
        >
          <div className="space-y-3">
            <InputField label="登记流程" hint={`共 ${registry?.workflows.length ?? 0} 个登记流程，均未连接实际流程运行时`}>
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
                  <p className="text-[10.5px] text-slate-500">
                    登记版本 <span className="font-mono">{picked.versionId}</span> · 责任服务 <span className="font-mono">{picked.ownerService}</span> · 未连接运行时
                  </p>
                  <p className="font-mono text-[10.5px] text-slate-400 break-all">所需行动 {picked.requiredActionIds.join(' | ')}</p>
                </div>
              ) : null;
            })()}
            <InputField label="流程版本" hint="必须固定明确版本（默认取登记版本）">
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
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">流程</span>
          <span className="font-mono text-slate-600 text-right break-all">{ref_.workflowId}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">流程版本</span>
          <span className="font-mono text-slate-600 text-right break-all">{ref_.workflowVersionId}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">责任服务</span>
          <span className="font-mono text-slate-600 text-right">{ref_.ownerService}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">运行时</span>
          <span className="text-right">
            {registered
              ? registered.executable
                ? <span className="text-emerald-600 font-semibold">可执行</span>
                : <span className="text-amber-700 font-semibold">未连接运行时</span>
              : <span className="text-amber-700 font-semibold">未登记</span>}
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-slate-600">所需行动（{ref_.requiredActionIds.length}）</p>
        {ref_.requiredActionIds.map((aid) => (
          <p key={aid} className={`text-[10.5px] font-mono flex items-center gap-1 ${compat.missing.includes(aid) ? 'text-red-600' : 'text-slate-500'}`}>
            <CircleDot className="h-2.5 w-2.5 shrink-0"/>{aid}
          </p>
        ))}
      </div>
      {registered && (
        <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">{registered.description}</p>
      )}
      {editable && (
        <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
          <Pencil className="h-3.5 w-3.5"/>修改引用
        </button>
      )}
    </div>
  );
}
