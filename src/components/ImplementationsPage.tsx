/**
 * 实现绑定页（Batch 3 · 06）。
 *
 * - 读取：GET /models/:id/implementation-bindings（同一 ViewReference）与
 *   GET /api/v1/ontology/registry。25 个 ACTION + 3 个 FUNCTION 绑定分组展示，
 *   全部来自 HTTP 返回。
 * - 编辑：从 Registry 选择 implementationId 与明确的 implementationVersionId，
 *   经 POST /changesets/:id/operations 写入当前草稿；所有修改进入同一个
 *   ChangeSet。
 * - 未解决状态：版本未锁定 / IO 不兼容 / 副作用不匹配允许保存草稿（服务端
 *   接受），页面显示“未解决”，正式阻塞由 Batch 4 校验任务完成。
 * - 边界：本页不编辑实现的 URL、密钥、代码、重试与调度——这些属于 Registry
 *   与部署侧；liveEndpointVerified 为 Registry 登记信息（演示环境全部 false）。
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
import {resolveBinding} from '../ontology/compatibility';
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

const KIND_LABEL: Record<ImplementationBinding['kind'], string> = {
  ACTION: '行动实现（ACTION）',
  FUNCTION: '函数实现（FUNCTION）',
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
  const [modal, setModal] = useState<{mode: 'add' | 'edit'; initial?: ImplementationBinding} | null>(null);
  const [draft, setDraft] = useState<BindingDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const current = selectedId ? bindings.find((b) => b.id === selectedId) : undefined;
  const currentResolution = useMemo(
    () => (current ? resolveBinding(current, registry) : undefined),
    [current, registry],
  );

  const q = filter.trim().toLowerCase();
  const matches = (b: ImplementationBinding) =>
    !q || b.id.toLowerCase().includes(q) || b.implementationId.toLowerCase().includes(q)
    || (b.actionId ?? '').toLowerCase().includes(q);

  const actionBindings = bindings.filter((b) => b.kind === 'ACTION' && matches(b));
  const functionBindings = bindings.filter((b) => b.kind === 'FUNCTION' && matches(b));

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
      if (!ID_PATTERN.test(draft.id)) {setFormError('绑定 ID 需匹配 ^[A-Za-z][A-Za-z0-9_.:-]*$'); return;}
      if (bindings.some((b) => b.id === draft.id)) {setFormError(`绑定 ${draft.id} 已存在`); return;}
    }
    if (!draft.implementationId.trim()) {setFormError('请从 Registry 选择 implementationId'); return;}
    if (!draft.implementationVersionId.trim()) {setFormError('请填写明确的 implementationVersionId（未锁版本的草稿可在 Batch 4 校验前保留）'); return;}
    if (draft.kind === 'ACTION' && !draft.actionId) {setFormError('ACTION 绑定需关联行动契约 actionId'); return;}
    if (draft.expectedSideEffects.length === 0) {setFormError('expectedSideEffects 至少一项（契约 minItems=1）'); return;}
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
        <p className="text-xs">正在读取 GET /models/{modelId}/implementation-bindings 与 GET /registry …</p>
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

      {/* 边界声明 */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600">
        <Unlink className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"/>
        <p>
          本页只维护<b>本体模型 → Registry 实现</b>的绑定关系；不编辑实现的 URL、密钥、代码、重试与调度
          （部署信息由 Registry / 部署侧管理）。演示 Registry 全部 <span className="font-mono">transport=MOCK</span>、
          <span className="font-mono"> liveEndpointVerified=false</span>，未连接生产 Runtime。
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 w-full space-y-4">
          {(['ACTION', 'FUNCTION'] as const).map((kind) => {
            const items = kind === 'ACTION' ? actionBindings : functionBindings;
            const total = bindings.filter((b) => b.kind === kind).length;
            return (
              <div key={kind} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-[13px] font-bold text-slate-700">
                    {KIND_LABEL[kind]} <span className="font-mono text-slate-400">({total})</span>
                  </h2>
                  {kind === 'ACTION' && editable && (
                    <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="h-3.5 w-3.5"/>新增绑定
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[680px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-wide">
                        <th className="text-left px-4 py-2 font-bold">绑定</th>
                        {kind === 'ACTION' && <th className="text-left px-3 py-2 font-bold">行动契约</th>}
                        <th className="text-left px-3 py-2 font-bold">Registry 实现</th>
                        <th className="text-left px-3 py-2 font-bold">解析状态</th>
                        <th className="text-left px-3 py-2 font-bold">live 验证</th>
                        {editable && <th className="px-4 py-2"/>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((b) => {
                        const resolution = resolveBinding(b, registry);
                        const active = b.id === selectedId;
                        return (
                          <tr
                            key={b.id}
                            onClick={() => select(b.id)}
                            className={`border-t border-slate-100 cursor-pointer ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}`}
                          >
                            <td className="px-4 py-2.5 font-mono text-slate-700">{b.id}</td>
                            {kind === 'ACTION' && <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{b.actionId ?? '—'}</td>}
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
                                ? <span className={`text-[10.5px] font-mono ${resolution.implementation.liveEndpointVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {resolution.implementation.liveEndpointVerified ? 'verified' : 'false'}
                                  </span>
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
                      {items.length === 0 && (
                        <tr><td colSpan={kind === 'ACTION' ? 6 : 5} className="px-4 py-8 text-center text-slate-400">无匹配的绑定</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inspector */}
        <aside className="w-full xl:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          {!current ? (
            <div className="py-12 text-center space-y-2">
              <Link2 className="h-6 w-6 text-slate-200 mx-auto"/>
              <p className="text-xs text-slate-400">在表格中选择一个实现绑定</p>
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

      {modal && draft && (
        <Modal
          title={modal.mode === 'add' ? '新增实现绑定' : `编辑绑定 ${draft.id}`}
          subtitle="UPSERT implementationBindings 到当前草稿。implementationId / implementationVersionId 从 Registry 选择；版本未锁定、IO 不兼容、副作用不匹配也允许保存草稿（显示未解决，Batch 4 校验阻塞发布）。"
          onClose={() => setModal(null)}
        >
          <div className="space-y-3">
            {modal.mode === 'add' && (
              <div className="grid grid-cols-2 gap-3">
                <InputField label="绑定 ID" hint="字母开头，可含数字与 _ . : -">
                  <input value={draft.id} onChange={(e) => setDraft({...draft, id: e.target.value})} className="input font-mono" placeholder="例如 bind-confirmAssertion-v2"/>
                </InputField>
                <InputField label="类型 kind">
                  <select value={draft.kind} onChange={(e) => setDraft({...draft, kind: e.target.value as ImplementationBinding['kind']})} className="input">
                    <option value="ACTION">ACTION（关联行动契约）</option>
                    <option value="FUNCTION">FUNCTION（函数实现）</option>
                  </select>
                </InputField>
              </div>
            )}
            {draft.kind === 'ACTION' && (
              <InputField label="行动契约 actionId" hint="来自 GET /models/:id/actions（当前视图）">
                <select value={draft.actionId} onChange={(e) => setDraft({...draft, actionId: e.target.value})} className="input font-mono">
                  <option value="">— 选择行动契约 —</option>
                  {actions.map((a) => <option key={a.id} value={a.id}>{a.id}（{a.nameCn}）</option>)}
                </select>
              </InputField>
            )}
            <InputField label="Registry 实现 implementationId" hint={`Registry 登记实现 ${registry?.implementations.length ?? '…'} 个`}>
              <select value={draft.implementationId} onChange={(e) => pickImplementation(e.target.value)} className="input font-mono">
                <option value="">— 从 Registry 选择 —</option>
                {(registry?.implementations ?? [])
                  .filter((i) => i.kind === draft.kind)
                  .map((i) => (
                    <option key={i.id} value={i.id}>{i.nameCn}（{i.id}）</option>
                  ))}
              </select>
            </InputField>
            <InputField label="实现版本 implementationVersionId" hint="选择实现时自动带出 Registry 登记版本；可手改（用于演示未锁版本草稿）">
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

function BindingInspector({binding, registry, editable, onEdit}: {
  binding: ImplementationBinding;
  registry: Registry | undefined;
  editable: boolean;
  onEdit: () => void;
}) {
  const resolution = resolveBinding(binding, registry);
  const impl = resolution.implementation;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 font-mono break-all">{binding.id}</h3>
          <p className="text-[10.5px] text-slate-400 mt-0.5">{KIND_LABEL[binding.kind]}</p>
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
        <Row label="输入 IO Contract"><span className="font-mono text-[10.5px] text-slate-500 break-all">{binding.inputContractRef}</span></Row>
        <Row label="输出 IO Contract"><span className="font-mono text-[10.5px] text-slate-500 break-all">{binding.outputContractRef}</span></Row>
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
        <p className="text-[11px] font-bold text-slate-600">Registry 对照</p>
        {impl ? (
          <div className="space-y-1 text-[11.5px] text-slate-600">
            <p>{impl.nameCn} <span className="font-mono text-[10px] text-slate-400">{impl.id}@{impl.versionId}</span></p>
            <p className="font-mono text-[10.5px] text-slate-500">transport {impl.transport} · liveEndpointVerified {String(impl.liveEndpointVerified)} · demoMode {impl.demoMode}</p>
            <p className="font-mono text-[10.5px] text-slate-400">实现副作用 {impl.sideEffects.join(' | ') || '—'}</p>
          </div>
        ) : (
          <p className="text-[11.5px] text-amber-700">Registry 中未找到 {binding.implementationId}。</p>
        )}
      </div>

      {resolution.issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 space-y-1">
          <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
            <CircleDot className="h-3 w-3"/>未解决（可保留在草稿中，Batch 4 校验将阻塞发布）
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
