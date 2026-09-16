/**
 * 实现绑定页（Batch 3 · 06；Batch 3.5 结构对齐）。
 *
 * - 读取：GET /models/:id/implementation-bindings（同一 ViewReference）与
 *   GET /api/v1/ontology/registry。全部绑定在一张主表中，ACTION / FUNCTION
 *   用顶部筛选切换（不再上下两个大表）。
 * - 编辑：从 Registry 选择 implementationId 与明确的 implementationVersionId，
 *   经 POST /changesets/:id/operations 写入当前草稿；所有修改进入同一个
 *   ChangeSet。
 * - 下方显示当前选中绑定的兼容性对照（绑定值 vs Registry 登记值：版本 /
 *   输入合同 / 输出合同 / 副作用）。未解决状态允许保存草稿（服务端接受），
 *   正式阻塞由 Batch 4 校验任务完成。
 * - 文案：liveEndpointVerified=false → “生产端点尚未验证”；
 *   transport=MOCK → “当前使用演示实现”。原始工程值在「技术详情」抽屉。
 * - 边界：本页不编辑实现的 URL、密钥、代码、重试与调度——这些属于 Registry
 *   与部署侧。
 */
import {useMemo, useState, type ReactNode} from 'react';
import {
  AlertTriangle,
  CircleDot,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Unlink,
} from 'lucide-react';
import type {ImplementationBinding, Registry} from '../api/ontology-v1/types.generated';
import {useActions, useActorScope, useImplementationBindings, useRegistry} from '../ontology/queries';
import {resolveBinding, type BindingResolution} from '../ontology/compatibility';
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

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;

const SIDE_EFFECT_OPTIONS = ['NONE', 'SOURCE_READ', 'GOVERNANCE_STATE', 'EXTERNAL_JOB', 'SOURCE_WRITE'];

const KIND_SHORT: Record<ImplementationBinding['kind'], string> = {
  ACTION: '行动实现',
  FUNCTION: '函数实现',
};

const KIND_CHIP: Record<ImplementationBinding['kind'], string> = {
  ACTION: 'bg-blue-50 text-blue-700 border-blue-200',
  FUNCTION: 'bg-violet-50 text-violet-700 border-violet-200',
};

interface BindingDraft {
  id: string;
  kind: ImplementationBinding['kind'];
  actionId: string;
  implementationId: string;
  implementationVersionId: string;
  inputContractRef: string;
  outputContractRef: string;
  expectedSideEffects: string[];
}

export default function ImplementationsPage() {
  const ctx = useModelContext();
  const {route, resolvedView, model, isDraft, selectedId, select, navigateToView, modelId, capabilities} = ctx;
  const scope = useActorScope();
  const bindingsQuery = useImplementationBindings(scope, modelId, ctx.view);
  const registryQuery = useRegistry(scope);
  const actionsQuery = useActions(scope, modelId, ctx.view);

  const registry = registryQuery.data;
  const bindings = bindingsQuery.data?.items ?? [];
  const actions = actionsQuery.data?.items ?? [];

  const editState = editPolicy({origin: 'LOCAL', model, view: resolvedView, capabilities});
  const editable = editState.editable;
  const draftId = isDraft && 'changeSetId' in route.view ? route.view.changeSetId : null;

  const w = useDraftWrite({scope, modelId, resolvedView, draftId, selectedId, navigateToView});
  const enter = useEnterDraft({scope, modelId, model, resolvedView, selectedId, navigateToView});

  const [filter, setFilter] = useState('');
  // ACTION / FUNCTION 改为顶部筛选：同一张主表，不再上下两个大表。
  const [kindFilter, setKindFilter] = useState<'ALL' | ImplementationBinding['kind']>('ALL');
  const [modal, setModal] = useState<{mode: 'add' | 'edit'; initial?: ImplementationBinding} | null>(null);
  const [draft, setDraft] = useState<BindingDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const current = selectedId ? bindings.find((b) => b.id === selectedId) : undefined;
  const currentResolution = useMemo(
    () => (current ? resolveBinding(current, registry) : undefined),
    [current, registry],
  );

  const q = filter.trim().toLowerCase();
  const filtered = useMemo(() => bindings.filter((b) => {
    if (kindFilter !== 'ALL' && b.kind !== kindFilter) return false;
    return !q || b.id.toLowerCase().includes(q) || b.implementationId.toLowerCase().includes(q)
      || (b.actionId ?? '').toLowerCase().includes(q);
  }), [bindings, kindFilter, q]);

  const actionCount = bindings.filter((b) => b.kind === 'ACTION').length;
  const functionCount = bindings.filter((b) => b.kind === 'FUNCTION').length;

  const openAdd = () => {
    setFormError(null);
    setDraft({
      id: '', kind: 'ACTION', actionId: actions[0]?.id ?? '',
      implementationId: '', implementationVersionId: '',
      inputContractRef: '', outputContractRef: '', expectedSideEffects: ['NONE'],
    });
    setModal({mode: 'add'});
  };

  const openEdit = (b: ImplementationBinding) => {
    setFormError(null);
    setDraft({
      id: b.id, kind: b.kind, actionId: b.actionId ?? '',
      implementationId: b.implementationId,
      implementationVersionId: b.implementationVersionId,
      inputContractRef: b.inputContractRef,
      outputContractRef: b.outputContractRef,
      expectedSideEffects: [...b.expectedSideEffects],
    });
    setModal({mode: 'edit', initial: b});
  };

  /** 选择 Registry 实现：自动带出登记版本与 IO Contract（仍可手改以演示未解决状态）。 */
  const pickImplementation = (implementationId: string) => {
    if (!draft) return;
    const impl = registry?.implementations.find((i) => i.id === implementationId);
    setDraft({
      ...draft,
      implementationId,
      implementationVersionId: impl?.versionId ?? draft.implementationVersionId,
      inputContractRef: impl?.inputContractRef ?? draft.inputContractRef,
      outputContractRef: impl?.outputContractRef ?? draft.outputContractRef,
      expectedSideEffects: impl ? [...impl.sideEffects] : draft.expectedSideEffects,
    });
  };

  const toggleSideEffect = (value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      expectedSideEffects: draft.expectedSideEffects.includes(value)
        ? draft.expectedSideEffects.filter((v) => v !== value)
        : [...draft.expectedSideEffects, value],
    });
  };

  const submit = () => {
    if (!draft) return;
    setFormError(null);
    if (modal?.mode === 'add') {
      if (!ID_PATTERN.test(draft.id)) {setFormError('绑定 ID 需以字母开头，可含数字与 _ . : -'); return;}
      if (bindings.some((b) => b.id === draft.id)) {setFormError(`绑定 ${draft.id} 已存在`); return;}
    }
    if (!draft.implementationId.trim()) {setFormError('请从登记实现中选择'); return;}
    if (!draft.implementationVersionId.trim()) {setFormError('请填写明确的实现版本（未锁版本的草稿可在发布校验前保留）'); return;}
    if (draft.kind === 'ACTION' && !draft.actionId) {setFormError('ACTION 绑定需选择关联的行动契约'); return;}
    if (draft.expectedSideEffects.length === 0) {setFormError('预期副作用至少一项（契约要求至少声明一项）'); return;}
    const value: ImplementationBinding = {
      id: draft.id,
      kind: draft.kind,
      ...(draft.kind === 'ACTION' ? {actionId: draft.actionId} : {}),
      implementationId: draft.implementationId.trim(),
      implementationVersionId: draft.implementationVersionId.trim(),
      inputContractRef: draft.inputContractRef.trim(),
      outputContractRef: draft.outputContractRef.trim(),
      expectedSideEffects: draft.expectedSideEffects,
    };
    // 未解析出问题的绑定同样允许保存（草稿态），由 Batch 4 校验阻塞发布。
    w.save(
      [{op: 'UPSERT', collection: 'implementationBindings', id: value.id, value}],
      modal?.mode === 'add' ? `新增${draft.kind === 'ACTION' ? '行动' : '函数'}实现绑定 ${value.id}` : `修改实现绑定 ${value.id}`,
      {selectedId: value.id},
    );
    setModal(null);
  };

  if (bindingsQuery.isLoading || registryQuery.isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl py-16 flex flex-col items-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500"/>
        <p className="text-xs">正在读取实现绑定…</p>
      </div>
    );
  }
  if (bindingsQuery.isError || registryQuery.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-2 text-[12.5px] text-red-700">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
        <p>{((bindingsQuery.isError ? bindingsQuery.error : registryQuery.error) as Error).message}</p>
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

      {/* 边界声明（产品文案；原始工程值见「技术详情」抽屉） */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600">
        <Unlink className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"/>
        <p>
          本页只维护<b>本体模型 → 实现登记</b>的绑定关系；不编辑实现的地址、密钥、代码、重试与调度
          （部署信息由实现登记与部署侧管理）。演示实现均为<b>当前使用演示实现</b>，且<b>生产端点尚未验证</b>。
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* 主表：ACTION / FUNCTION 顶部筛选 + 单一表格 */}
        <div className="flex-1 min-w-0 w-full bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-[13px] font-bold text-slate-700">
                实现绑定 <span className="font-mono text-slate-400">({filtered.length}/{bindings.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="按绑定 / 实现 / 行动过滤"
                    className="pl-8 pr-2 py-1.5 text-[11.5px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-52"
                  />
                </div>
                {editable && (
                  <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="h-3.5 w-3.5"/>新增绑定
                  </button>
                )}
              </div>
            </div>
            {/* 类型筛选：全部 / ACTION / FUNCTION */}
            <div className="flex items-center gap-1.5 flex-wrap" data-testid="binding-kind-filter">
              {([
                {id: 'ALL' as const, label: `全部 ${bindings.length}`},
                {id: 'ACTION' as const, label: `行动实现 ${actionCount}`},
                {id: 'FUNCTION' as const, label: `函数实现 ${functionCount}`},
              ]).map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKindFilter(k.id)}
                  className={`px-2.5 py-1 rounded-full text-[12px] font-bold border transition-colors ${
                    kindFilter === k.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          {/* 主表限高内滚：1080p 下“兼容性对照”保持在首屏可见 */}
          <div className="overflow-auto max-h-[44vh]">
            <table className="w-full text-xs min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-wide sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                  <th className="text-left px-4 py-2 font-bold">绑定</th>
                  <th className="text-left px-3 py-2 font-bold">类型</th>
                  <th className="text-left px-3 py-2 font-bold">行动契约</th>
                  <th className="text-left px-3 py-2 font-bold">登记实现</th>
                  <th className="text-left px-3 py-2 font-bold">解析状态</th>
                  <th className="text-left px-3 py-2 font-bold">端点状态</th>
                  {editable && <th className="px-4 py-2"/>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const resolution = resolveBinding(b, registry);
                  const active = b.id === selectedId;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => select(b.id)}
                      className={`border-t border-slate-100 cursor-pointer ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-slate-700">{b.id}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${KIND_CHIP[b.kind]}`}>{KIND_SHORT[b.kind]}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{b.actionId ?? '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-600">
                        {b.implementationId}@{b.implementationVersionId}
                      </td>
                      <td className="px-3 py-2.5">
                        {resolution.issues.length === 0
                          ? <span className="px-1.5 py-0.5 rounded border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">已解决</span>
                          : <span className="px-1.5 py-0.5 rounded border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">未解决（{resolution.issues.length}）</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {resolution.implementation
                          ? (
                            <span className="text-[10.5px] text-slate-500">
                              {resolution.implementation.transport === 'MOCK' ? '当前使用演示实现' : resolution.implementation.transport}
                              {!resolution.implementation.liveEndpointVerified && <span className="text-slate-400"> · 生产端点尚未验证</span>}
                            </span>
                          )
                          : <span className="text-[10.5px] text-slate-300">—</span>}
                      </td>
                      {editable && (
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={(e) => {e.stopPropagation(); select(b.id); openEdit(b);}}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                            title="编辑绑定"
                          ><Pencil className="h-3.5 w-3.5"/></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={editable ? 7 : 6} className="px-4 py-8 text-center text-slate-400">无匹配的绑定</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector */}
        <aside className="w-full xl:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          {!current ? (
            <div className="py-12 text-center space-y-2">
              <Link2 className="h-6 w-6 text-slate-200 mx-auto"/>
              <p className="text-xs text-slate-400">在表格中选择一个实现绑定</p>
              <p className="text-[10.5px] text-slate-300">选择后下方显示该绑定的兼容性对照</p>
            </div>
          ) : (
            <BindingInspector
              binding={current}
              registry={registry}
              editable={editable}
              onEdit={() => openEdit(current)}
            />
          )}
        </aside>
      </div>

      {/* 下方：当前选中绑定的兼容性对照（绑定值 vs Registry 登记值） */}
      {current && currentResolution && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-[13px] font-bold text-slate-700">
              兼容性对照 · <span className="font-mono text-slate-500">{current.id}</span>
            </h2>
            {currentResolution.issues.length === 0
              ? <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">与登记信息一致</span>
              : <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{currentResolution.issues.length} 项不一致（可保留在草稿中，发布前校验将阻塞发布）</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-wide">
                  <th className="text-left px-4 py-2 font-bold">对照项</th>
                  <th className="text-left px-3 py-2 font-bold">绑定值（当前视图）</th>
                  <th className="text-left px-3 py-2 font-bold">登记值</th>
                  <th className="text-left px-3 py-2 font-bold w-16">一致</th>
                </tr>
              </thead>
              <tbody>
                <CompareRow
                  label="实现版本"
                  bound={current.implementationVersionId}
                  registered={currentResolution.implementation?.versionId}
                  ok={currentResolution.versionLocked}
                />
                <CompareRow
                  label="输入合同"
                  bound={current.inputContractRef || '（空）'}
                  registered={currentResolution.implementation?.inputContractRef}
                  ok={Boolean(currentResolution.implementation && currentResolution.implementation.inputContractRef === current.inputContractRef)}
                />
                <CompareRow
                  label="输出合同"
                  bound={current.outputContractRef || '（空）'}
                  registered={currentResolution.implementation?.outputContractRef}
                  ok={Boolean(currentResolution.implementation && currentResolution.implementation.outputContractRef === current.outputContractRef)}
                />
                <CompareRow
                  label="副作用"
                  bound={current.expectedSideEffects.join(' | ') || '（空）'}
                  registered={currentResolution.implementation?.sideEffects.join(' | ')}
                  ok={currentResolution.sideEffectsMatch}
                />
              </tbody>
            </table>
          </div>
          {currentResolution.issues.length > 0 && (
            <div className="px-4 py-3 bg-amber-50/60 border-t border-amber-200 space-y-1">
              {currentResolution.issues.map((issue) => (
                <p key={issue} className="text-[11.5px] text-amber-800 flex items-start gap-1.5">
                  <CircleDot className="h-3 w-3 shrink-0 mt-1"/>{issue}
                </p>
              ))}
            </div>
          )}
          {!currentResolution.implementation && (
            <p className="px-4 py-3 border-t border-slate-100 text-[11.5px] text-amber-700">
              登记信息中未找到实现 <span className="font-mono">{current.implementationId}</span>，版本未锁定。
            </p>
          )}
        </div>
      )}

      {modal && draft && (
        <Modal
          title={modal.mode === 'add' ? '新增实现绑定' : `编辑绑定 ${draft.id}`}
          subtitle="修改将写入当前草稿。实现与版本从登记信息中选择；版本未锁定、输入输出不兼容、副作用不匹配也允许保存草稿（显示为未解决，后续校验将阻塞发布）。"
          onClose={() => setModal(null)}
        >
          <div className="space-y-3">
            {modal.mode === 'add' && (
              <div className="grid grid-cols-2 gap-3">
                <InputField label="绑定 ID" hint="字母开头，可含数字与 _ . : -">
                  <input value={draft.id} onChange={(e) => setDraft({...draft, id: e.target.value})} className="input font-mono" placeholder="例如 bind-confirmAssertion-v2"/>
                </InputField>
                <InputField label="类型">
                  <select value={draft.kind} onChange={(e) => setDraft({...draft, kind: e.target.value as ImplementationBinding['kind']})} className="input">
                    <option value="ACTION">行动实现（关联行动契约）</option>
                    <option value="FUNCTION">函数实现</option>
                  </select>
                </InputField>
              </div>
            )}
            {draft.kind === 'ACTION' && (
              <InputField label="行动契约" hint="来自当前视图的行动契约">
                <select value={draft.actionId} onChange={(e) => setDraft({...draft, actionId: e.target.value})} className="input font-mono">
                  <option value="">— 选择行动契约 —</option>
                  {actions.map((a) => <option key={a.id} value={a.id}>{a.id}（{a.nameCn}）</option>)}
                </select>
              </InputField>
            )}
            <InputField label="登记实现" hint={`登记在册的实现 ${registry?.implementations.length ?? '…'} 个`}>
              <select value={draft.implementationId} onChange={(e) => pickImplementation(e.target.value)} className="input font-mono">
                <option value="">— 从登记信息选择 —</option>
                {(registry?.implementations ?? [])
                  .filter((i) => i.kind === draft.kind)
                  .map((i) => (
                    <option key={i.id} value={i.id}>{i.nameCn}（{i.id}）</option>
                  ))}
              </select>
            </InputField>
            <InputField label="实现版本" hint="选择实现时自动带出登记版本；可手改（用于演示未锁版本的草稿）">
              <input value={draft.implementationVersionId} onChange={(e) => setDraft({...draft, implementationVersionId: e.target.value})} className="input font-mono"/>
            </InputField>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="输入 IO Contract">
                <input value={draft.inputContractRef} onChange={(e) => setDraft({...draft, inputContractRef: e.target.value})} className="input font-mono text-[11px]"/>
              </InputField>
              <InputField label="输出 IO Contract">
                <input value={draft.outputContractRef} onChange={(e) => setDraft({...draft, outputContractRef: e.target.value})} className="input font-mono text-[11px]"/>
              </InputField>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-600">预期副作用 expectedSideEffects（至少一项）</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {sideEffectOptionsFor(draft).map((v) => (
                  <label key={v} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-600">
                    <input type="checkbox" checked={draft.expectedSideEffects.includes(v)} onChange={() => toggleSideEffect(v)}/>
                    {v}
                  </label>
                ))}
              </div>
            </div>
            {formError && <p className="text-[11.5px] text-red-600">{formError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setModal(null)} className="btn-ghost">取消</button>
            <button onClick={submit} disabled={w.saving} className="btn-primary">
              {w.saving && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}{modal.mode === 'add' ? '创建绑定' : '保存绑定'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function sideEffectOptionsFor(draft: BindingDraft): string[] {
  // 选项 = 契约枚举 ∪ 绑定已携带的值（保留种子里的自定义值）。
  const extra = draft.expectedSideEffects.filter((v) => !SIDE_EFFECT_OPTIONS.includes(v));
  return [...SIDE_EFFECT_OPTIONS, ...extra];
}

function CompareRow({label, bound, registered, ok}: {label: string; bound: string; registered: string | undefined; ok: boolean}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2.5 text-[11.5px] font-bold text-slate-600">{label}</td>
      <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-600 break-all">{bound}</td>
      <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500 break-all">{registered ?? '（未登记）'}</td>
      <td className="px-3 py-2.5">
        {ok
          ? <span className="text-emerald-600 font-bold text-[13px]">✓</span>
          : <span className="text-amber-600 font-bold text-[13px]">✗</span>}
      </td>
    </tr>
  );
}

function BindingInspector({binding, registry, editable, onEdit}: {
  binding: ImplementationBinding;
  registry: Registry | undefined;
  editable: boolean;
  onEdit: () => void;
}) {
  const resolution: BindingResolution = resolveBinding(binding, registry);
  const impl = resolution.implementation;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 font-mono break-all">{binding.id}</h3>
          <p className="text-[10.5px] text-slate-400 mt-0.5">
            <span className={`px-1.5 py-0.5 rounded border text-[9.5px] font-bold ${KIND_CHIP[binding.kind]}`}>{KIND_SHORT[binding.kind]}</span>
          </p>
        </div>
        {resolution.issues.length === 0
          ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">已解决</span>
          : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">未解决</span>}
      </div>

      <div className="space-y-2 text-[12px]">
        {binding.actionId && (
          <Row label="行动契约"><span className="font-mono text-slate-600">{binding.actionId}</span></Row>
        )}
        <Row label="实现"><span className="font-mono text-slate-600">{binding.implementationId}@{binding.implementationVersionId}</span></Row>
        <div className="space-y-1">
          <p className="text-slate-400 text-[11px] font-semibold">预期副作用</p>
          <div className="flex flex-wrap gap-1">
            {binding.expectedSideEffects.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded border text-[10px] font-mono bg-rose-50 text-rose-700 border-rose-200">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
        <p className="text-[11px] font-bold text-slate-600">登记对照</p>
        {impl ? (
          <div className="space-y-1.5 text-[11.5px] text-slate-600">
            <p className="font-semibold text-slate-700">{impl.nameCn}</p>
            {impl.transport === 'MOCK'
              ? <p className="text-slate-500">当前使用演示实现</p>
              : <p className="text-slate-500">传输方式 {impl.transport}</p>}
            {!impl.liveEndpointVerified && <p className="text-slate-500">生产端点尚未验证</p>}
            <p className="text-slate-500">实现副作用：{impl.sideEffects.join('、') || '—'}</p>
          </div>
        ) : (
          <p className="text-[11.5px] text-amber-700">登记信息中未找到 {binding.implementationId}。</p>
        )}
        <p className="text-[10.5px] text-slate-400">工程原始值见页面头「技术详情」抽屉。</p>
      </div>

      {resolution.issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 space-y-1">
          <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
            <CircleDot className="h-3 w-3"/>未解决（可保留在草稿中，发布前校验将阻塞发布）
          </p>
          {resolution.issues.map((issue) => <p key={issue} className="text-[11px] text-amber-700">· {issue}</p>)}
        </div>
      )}

      {editable && (
        <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
          <Pencil className="h-3.5 w-3.5"/>编辑绑定
        </button>
      )}
    </div>
  );
}

function Row({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-400 text-[11px] font-semibold shrink-0">{label}</span>
      <span className="text-right min-w-0">{children}</span>
    </div>
  );
}
