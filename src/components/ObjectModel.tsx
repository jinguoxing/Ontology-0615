/**
 * 对象类型页（Batch 2 重写）。
 *
 * 直接消费 ontology-v1 generated types 与 operations，不再经过旧
 * ObjectType/Property 投影：
 * - 读取：ModelContext 提供的 ResolvedView.document.objectTypes
 *   （本地类型 origin=LOCAL/SYSTEM 可编辑；外部引用 origin=EXTERNAL 只读，
 *   服务端同样拒绝写入，错误码 EXTERNAL_READ_ONLY）。
 * - 写入：UPSERT 完整 ObjectTypeDefinition 到 URL 指向的 OPEN 草稿，
 *   携带 If-Match（视图 etag，如 "cs-drkn-demo:r12"）与 Idempotency-Key；
 *   成功后把 URL revision replace 成服务端返回的新修订号；
 *   412 冲突保留用户输入并提示载入最新修订。
 * - 已发布正式版本只读：从正式版本进入编辑会先创建/继续草稿（ChangeSet）。
 * selected 类型 id 走 URL `selected` 参数，刷新/分享可复现。
 */
import {useMemo, useState, type ReactNode} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {ontologyV1} from '../api/ontology-v1/client';
import type {
  ObjectTypeDefinition,
  PropertyDefinition,
} from '../api/ontology-v1/types.generated';
import {
  apiErrorMessage,
  conflictRevision,
  useActorScope,
  useApplyOperations,
  useCreateChangeSet,
} from '../ontology/queries';
import {useModelContext} from '../ontology/ModelContext';

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;
const VALUE_TYPES: PropertyDefinition['valueType'][] = [
  'string', 'integer', 'number', 'boolean', 'datetime', 'object', 'array', 'json',
];

const ORIGIN_BADGE: Record<string, {label: string; cls: string}> = {
  LOCAL: {label: '本地', cls: 'bg-blue-50 text-blue-700 border-blue-200'},
  SYSTEM: {label: '系统', cls: 'bg-slate-100 text-slate-600 border-slate-200'},
  EXTERNAL: {label: '外部引用', cls: 'bg-amber-50 text-amber-700 border-amber-200'},
};

type Banner =
  | {kind: 'success'; text: string}
  | {kind: 'error'; text: string}
  | null;

interface PropertyDraft {
  code: string;
  nameCn: string;
  valueType: PropertyDefinition['valueType'];
  required: boolean;
  isIdentity: boolean;
  definition: string;
  enumValues: string;
}

const emptyPropertyDraft: PropertyDraft = {
  code: '', nameCn: '', valueType: 'string', required: false, isIdentity: false, definition: '', enumValues: '',
};

export default function ObjectModel() {
  const ctx = useModelContext();
  const {route, resolvedView, model, isDraft, canEdit, select, selectedId, navigateToView} = ctx;
  const actorScope = useActorScope();
  const queryClient = useQueryClient();
  const applyOps = useApplyOperations(actorScope, ctx.modelId);
  const createChangeSet = useCreateChangeSet(actorScope, ctx.modelId);

  const [filter, setFilter] = useState('');
  const [banner, setBanner] = useState<Banner>(null);
  const [conflict, setConflict] = useState<{serverRevision: number} | null>(null);
  const [editingBasic, setEditingBasic] = useState(false);
  const [basicDraft, setBasicDraft] = useState({nameCn: '', definition: ''});
  const [propModal, setPropModal] = useState<{mode: 'add' | 'edit'; index: number; initial?: PropertyDefinition} | null>(null);
  const [propDraft, setPropDraft] = useState<PropertyDraft>(emptyPropertyDraft);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [typeDraft, setTypeDraft] = useState({id: '', nameCn: '', group: '', ownerService: 'platform-team', definition: ''});
  const [formError, setFormError] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);

  const types = resolvedView?.document.objectTypes ?? [];
  const groups = useMemo(() => {
    const byGroup = new Map<string, ObjectTypeDefinition[]>();
    for (const t of types) {
      const list = byGroup.get(t.group) ?? [];
      list.push(t);
      byGroup.set(t.group, list);
    }
    return [...byGroup.entries()].map(([name, items]) => ({name, items}));
  }, [types]);

  const current = selectedId ? types.find((t) => t.id === selectedId) : undefined;
  // 可编辑 = 草稿 + 权限 + 非外部引用。drkn-core 的内置类型 origin=SYSTEM，
  // 同样允许 UPSERT（服务端只拒绝 EXTERNAL，错误码 EXTERNAL_READ_ONLY）。
  const editable = canEdit && isDraft && current !== undefined && current.origin !== 'EXTERNAL';
  const draftId = isDraft && 'changeSetId' in route.view ? route.view.changeSetId : null;

  // ---- 保存（UPSERT 完整类型定义） ----

  const saveType = (definition: ObjectTypeDefinition, note: string, after?: () => void) => {
    if (!draftId || !resolvedView) return;
    setBanner(null);
    setConflict(null);
    applyOps.mutate(
      {
        changeSetId: draftId,
        operations: [{op: 'UPSERT', collection: 'objectTypes', id: definition.id, value: definition}],
        etag: resolvedView.etag,
      },
      {
        onSuccess: (cs) => {
          setBanner({kind: 'success', text: `${note} 已提交到草稿 ${cs.data.id} r${cs.data.revision}（服务端修订号）`});
          // URL revision 更新为服务端返回值；selected 保持当前类型。
          navigateToView({changeSetId: cs.data.id, revision: cs.data.revision}, {selectedId: definition.id, replace: true});
          after?.();
        },
        onError: (e) => {
          const rev = conflictRevision(e);
          if (rev !== null) {
            setConflict({serverRevision: rev});
          } else {
            setBanner({kind: 'error', text: apiErrorMessage(e)});
          }
        },
      },
    );
  };

  const submitBasic = () => {
    if (!current) return;
    setFormError(null);
    if (!basicDraft.nameCn.trim()) {
      setFormError('名称不能为空');
      return;
    }
    saveType(
      {...current, nameCn: basicDraft.nameCn.trim(), definition: basicDraft.definition.trim() || current.definition},
      '基本信息',
      () => setEditingBasic(false),
    );
  };

  const openAddProperty = () => {
    setPropDraft(emptyPropertyDraft);
    setPropModal({mode: 'add', index: -1});
  };

  const openEditProperty = (p: PropertyDefinition, index: number) => {
    setPropDraft({
      code: p.code,
      nameCn: p.nameCn,
      valueType: p.valueType,
      required: p.required,
      isIdentity: p.isIdentity,
      definition: p.definition,
      enumValues: (p.enumValues ?? []).join(', '),
    });
    setPropModal({mode: 'edit', index});
  };

  const submitProperty = () => {
    if (!current || !propModal) return;
    setFormError(null);
    if (!ID_PATTERN.test(propDraft.code)) {
      setFormError('属性 code 需匹配 ^[A-Za-z][A-Za-z0-9_.:-]*$');
      return;
    }
    const dup = current.properties.some((p, i) => i !== propModal.index && p.code === propDraft.code);
    if (dup) {
      setFormError(`属性 code ${propDraft.code} 已存在于该类型`);
      return;
    }
    const next: PropertyDefinition = {
      id: propDraft.code,
      code: propDraft.code,
      nameCn: propDraft.nameCn.trim() || propDraft.code,
      valueType: propDraft.valueType,
      required: propDraft.required,
      isIdentity: propDraft.isIdentity,
      definition: propDraft.definition.trim() || propDraft.nameCn.trim() || propDraft.code,
      ...(propDraft.enumValues.trim()
        ? {enumValues: propDraft.enumValues.split(/[,，]/).map((s) => s.trim()).filter(Boolean)}
        : {}),
    };
    const properties = propModal.mode === 'add'
      ? [...current.properties, next]
      : current.properties.map((p, i) => (i === propModal.index ? next : p));
    saveType({...current, properties}, propModal.mode === 'add' ? `新增属性 ${next.code}` : `修改属性 ${next.code}`, () => setPropModal(null));
  };

  const confirmRemoveProperty = () => {
    if (!current || removingIndex === null) return;
    const target = current.properties[removingIndex];
    const properties = current.properties.filter((_, i) => i !== removingIndex);
    saveType({...current, properties}, `移除属性 ${target.code}`, () => setRemovingIndex(null));
  };

  const submitNewType = () => {
    setFormError(null);
    if (!ID_PATTERN.test(typeDraft.id)) {
      setFormError('类型 ID 需匹配 ^[A-Za-z][A-Za-z0-9_.:-]*$');
      return;
    }
    if (!typeDraft.nameCn.trim()) {
      setFormError('请填写类型名称');
      return;
    }
    if (types.some((t) => t.id === typeDraft.id)) {
      setFormError(`类型 ${typeDraft.id} 已存在`);
      return;
    }
    saveType(
      {
        id: typeDraft.id,
        code: typeDraft.id,
        nameCn: typeDraft.nameCn.trim(),
        group: typeDraft.group.trim() || '未分组',
        ownerService: ID_PATTERN.test(typeDraft.ownerService) ? typeDraft.ownerService : 'platform-team',
        origin: 'LOCAL',
        definition: typeDraft.definition.trim() || `${typeDraft.nameCn.trim()} 的本地类型定义`,
        properties: [],
      },
      `新增对象类型 ${typeDraft.id}`,
      () => setAddTypeOpen(false),
    );
  };

  // ---- 正式版本 → 进入草稿 ----

  const goDraft = async () => {
    const csId = model?.activeChangeSetId;
    if (!csId) return;
    setDraftBusy(true);
    setFormError(null);
    try {
      const cs = await queryClient.fetchQuery({
        queryKey: ontologyKeys.changeSet({...actorScope, modelId: ctx.modelId}, csId),
        queryFn: () => ontologyV1.getChangeSet(ctx.modelId, csId),
        staleTime: 15_000,
      });
      navigateToView({changeSetId: cs.data.id, revision: cs.data.revision}, {selectedId});
    } catch (e) {
      setFormError(apiErrorMessage(e));
    } finally {
      setDraftBusy(false);
    }
  };

  const createDraftFromVersion = () => {
    const baseVersionId = resolvedView?.versionId ?? null;
    const m = baseVersionId?.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    const target = m ? `v${m[1]}.${Number(m[2]) + 1}.${m[3]}` : 'v1.0.0';
    createChangeSet.mutate(
      {
        name: `从 ${baseVersionId ?? '当前版本'} 创建的变更`,
        reason: '对象类型页：从正式版本进入编辑（Batch 2）',
        baseVersionId,
        targetVersionId: target,
      },
      {
        onSuccess: (cs) => navigateToView({changeSetId: cs.data.id, revision: cs.data.revision}, {selectedId}),
        onError: (e) => setBanner({kind: 'error', text: apiErrorMessage(e)}),
      },
    );
  };

  const loadLatestRevision = () => {
    if (!conflict || !draftId) return;
    setConflict(null);
    setBanner(null);
    navigateToView({changeSetId: draftId, revision: conflict.serverRevision}, {selectedId, replace: true});
  };

  // ---- 渲染 ----

  const filteredGroups = filter.trim()
    ? groups
        .map((g) => ({...g, items: g.items.filter((t) =>
          t.id.toLowerCase().includes(filter.toLowerCase()) ||
          t.nameCn.includes(filter))}))
        .filter((g) => g.items.length > 0)
    : groups;

  return (
    <div className="space-y-4">
      {/* 顶部状态条 */}
      {conflict && (
        <div className="flex items-start gap-2 px-4 py-3 bg-orange-50 border border-orange-300 rounded-xl text-[12.5px] text-orange-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
          <div className="flex-1">
            <p className="font-bold">保存冲突（412 REVISION_CONFLICT）</p>
            <p className="mt-0.5">
              草稿已被更新到 <strong>r{conflict.serverRevision}</strong>，本次提交未生效。
              你的修改仍保留在表单中；可载入最新修订后重试。
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={loadLatestRevision}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <RefreshCw className="h-3 w-3"/>载入最新修订
            </button>
            <button onClick={() => setConflict(null)} className="text-orange-500 hover:text-orange-700"><X className="h-4 w-4"/></button>
          </div>
        </div>
      )}
      {banner && (
        <div className={`flex items-start gap-2 px-4 py-3 border rounded-xl text-[12.5px] ${
          banner.kind === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {banner.kind === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5"/>
            : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>}
          <p className="flex-1">{banner.text}</p>
          <button
            onClick={() => setBanner(null)}
            className="shrink-0 opacity-60 hover:opacity-100"
          ><X className="h-4 w-4"/></button>
        </div>
      )}
      {formError && !conflict && (
        <p className="px-4 py-2.5 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl">{formError}</p>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* 左：分组类型列表 */}
        <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="按 ID / 名称过滤（客户端过滤真实数据）"
                className="w-full pl-8 pr-2 py-1.5 text-[11.5px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {canEdit && isDraft && (
            <button
              onClick={() => { setAddTypeOpen(true); setFormError(null); setTypeDraft({id: '', nameCn: '', group: groups[0]?.name ?? '', ownerService: 'platform-team', definition: ''}); }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5"/>新增对象类型
            </button>
          )}
          {filteredGroups.length === 0 && (
            <p className="text-center text-[11.5px] text-slate-400 py-6">
              {types.length === 0 ? '当前视图没有对象类型' : '无匹配的类型'}
            </p>
          )}
          {filteredGroups.map((g) => (
            <div key={g.name} className="space-y-1">
              <p className="px-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">
                {g.name} <span className="font-mono">({g.items.length})</span>
              </p>
              {g.items.map((t) => {
                const badge = ORIGIN_BADGE[t.origin] ?? ORIGIN_BADGE.LOCAL;
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    onClick={() => { select(t.id); setEditingBasic(false); setRemovingIndex(null); setPropModal(null); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-all ${
                      active
                        ? 'bg-blue-50 border-blue-300'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-[12px] font-bold truncate ${active ? 'text-blue-800' : 'text-slate-700'}`}>{t.nameCn}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${badge.cls}`}>{badge.label}</span>
                    </span>
                    <span className="block text-[9.5px] font-mono text-slate-400 truncate">{t.id} · {t.properties.length} 属性</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* 右：类型详情 */}
        <div className="flex-1 min-w-0">
          {!current ? (
            <EmptyDetail typesCount={types.length} canAdd={canEdit && isDraft} onAdd={() => { setAddTypeOpen(true); setTypeDraft({id: '', nameCn: '', group: groups[0]?.name ?? '', ownerService: 'platform-team', definition: ''}); }}/>
          ) : (
            <TypeDetail
              type={current}
              editable={editable}
              isDraft={isDraft}
              canEdit={canEdit}
              readOnlyReason={ctx.readOnlyReason}
              hasDraftChangeSet={Boolean(model?.activeChangeSetId)}
              draftBusy={draftBusy}
              createPending={createChangeSet.isPending}
              editingBasic={editingBasic}
              basicDraft={basicDraft}
              setBasicDraft={setBasicDraft}
              startEditBasic={() => { setBasicDraft({nameCn: current.nameCn, definition: current.definition}); setEditingBasic(true); }}
              cancelEditBasic={() => setEditingBasic(false)}
              submitBasic={submitBasic}
              saving={applyOps.isPending}
              propModal={propModal}
              openAddProperty={openAddProperty}
              openEditProperty={openEditProperty}
              propDraft={propDraft}
              setPropDraft={setPropDraft}
              submitProperty={submitProperty}
              closeProperty={() => setPropModal(null)}
              removingIndex={removingIndex}
              setRemovingIndex={setRemovingIndex}
              confirmRemoveProperty={confirmRemoveProperty}
              goDraft={() => void goDraft()}
              createDraftFromVersion={createDraftFromVersion}
            />
          )}
        </div>
      </div>

      {/* 新增对象类型弹层 */}
      {addTypeOpen && (
        <Modal title="新增对象类型" onClose={() => setAddTypeOpen(false)} subtitle="UPSERT objectTypes 到当前草稿（POST /changesets/:id/operations）">
          <div className="space-y-3">
            <InputField label="类型 ID" hint="字母开头，可含数字与 _ . : -">
              <input value={typeDraft.id} onChange={(e) => setTypeDraft((f) => ({...f, id: e.target.value}))}
                placeholder="例如 SupplierProfile" className="input" />
            </InputField>
            <InputField label="名称（中文）">
              <input value={typeDraft.nameCn} onChange={(e) => setTypeDraft((f) => ({...f, nameCn: e.target.value}))}
                placeholder="例如 供应商画像" className="input" />
            </InputField>
            <InputField label="分组" hint={`现有分组：${groups.map((g) => g.name).join('、') || '（无）'}`}>
              <input value={typeDraft.group} onChange={(e) => setTypeDraft((f) => ({...f, group: e.target.value}))}
                placeholder="可沿用现有分组或填写新分组" className="input" />
            </InputField>
            <InputField label="责任服务 ownerService">
              <input value={typeDraft.ownerService} onChange={(e) => setTypeDraft((f) => ({...f, ownerService: e.target.value}))}
                placeholder="platform-team" className="input font-mono" />
            </InputField>
            <InputField label="定义说明">
              <textarea value={typeDraft.definition} onChange={(e) => setTypeDraft((f) => ({...f, definition: e.target.value}))}
                rows={2} className="input" placeholder="类型定义（可空，将使用默认说明）" />
            </InputField>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setAddTypeOpen(false)} className="btn-ghost">取消</button>
            <button onClick={submitNewType} disabled={applyOps.isPending} className="btn-primary">
              {applyOps.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}创建类型
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .input { width: 100%; padding: 6px 10px; font-size: 12px; border: 1px solid rgb(226 232 240); border-radius: 8px; outline: none; background: white; }
        .input:focus { border-color: rgb(59 130 246); }
        .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: white; background: rgb(37 99 235); border-radius: 8px; }
        .btn-primary:hover { background: rgb(29 78 216); }
        .btn-primary:disabled { opacity: 0.6; }
        .btn-ghost { padding: 6px 12px; font-size: 12px; font-weight: 700; color: rgb(71 85 105); background: rgb(241 245 249); border-radius: 8px; }
        .btn-ghost:hover { background: rgb(226 232 240); }
      `}</style>
    </div>
  );
}

function EmptyDetail({typesCount, canAdd, onAdd}: {typesCount: number; canAdd: boolean; onAdd: () => void}) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center space-y-3">
      <Box className="h-8 w-8 text-slate-300 mx-auto"/>
      <p className="text-sm font-semibold text-slate-600">
        {typesCount === 0 ? '当前视图还没有对象类型' : '在左侧选择一个对象类型'}
      </p>
      {typesCount === 0 && canAdd && (
        <button onClick={onAdd} className="btn-primary mx-auto">
          <Plus className="h-3.5 w-3.5"/>新增第一个对象类型
        </button>
      )}
      {typesCount === 0 && !canAdd && (
        <p className="text-xs text-slate-400">当前身份或视图为只读（需草稿视图 + ontology.edit 权限）。</p>
      )}
    </div>
  );
}

function ReadOnlyNote({reason, isDraft, hasDraftChangeSet, canEdit, draftBusy, createPending, goDraft, createDraftFromVersion}: {
  reason: 'published-version' | 'viewer-permission' | null;
  isDraft: boolean;
  hasDraftChangeSet: boolean;
  canEdit: boolean;
  draftBusy: boolean;
  createPending: boolean;
  goDraft: () => void;
  createDraftFromVersion: () => void;
}) {
  if (reason === 'published-version') {
    return (
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-700">
        <Lock className="h-4 w-4 shrink-0 mt-0.5 text-slate-500"/>
        <div className="flex-1">
          <p className="font-bold">正在查看已发布正式版本（只读）</p>
          <p className="mt-0.5 text-slate-500">已发布版本不可直接编辑；修改需进入 ChangeSet 草稿。</p>
        </div>
        {canEdit && (
          <div className="shrink-0">
            {hasDraftChangeSet ? (
              <button onClick={goDraft} disabled={draftBusy} className="btn-primary">
                {draftBusy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}继续草稿
              </button>
            ) : (
              <button onClick={createDraftFromVersion} disabled={createPending} className="btn-primary">
                {createPending && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}创建变更草稿
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
  if (reason === 'viewer-permission') {
    return (
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] text-slate-700">
        <Eye className="h-4 w-4 shrink-0 mt-0.5 text-slate-500"/>
        <p>
          当前演示身份 <span className="font-mono font-bold">demo-viewer</span> 仅具备
          <span className="font-mono"> ontology.read</span>；写入接口返回 403 ACTION_DENIED，界面只读。
          {isDraft && ' 可在右上角切换为 demo-maintainer 后编辑。'}
        </p>
      </div>
    );
  }
  return null;
}

function TypeDetail(props: {
  type: ObjectTypeDefinition;
  editable: boolean;
  isDraft: boolean;
  canEdit: boolean;
  readOnlyReason: 'published-version' | 'viewer-permission' | null;
  hasDraftChangeSet: boolean;
  draftBusy: boolean;
  createPending: boolean;
  editingBasic: boolean;
  basicDraft: {nameCn: string; definition: string};
  setBasicDraft: (d: {nameCn: string; definition: string}) => void;
  startEditBasic: () => void;
  cancelEditBasic: () => void;
  submitBasic: () => void;
  saving: boolean;
  propModal: {mode: 'add' | 'edit'; index: number; initial?: PropertyDefinition} | null;
  openAddProperty: () => void;
  openEditProperty: (p: PropertyDefinition, index: number) => void;
  propDraft: PropertyDraft;
  setPropDraft: (d: PropertyDraft) => void;
  submitProperty: () => void;
  closeProperty: () => void;
  removingIndex: number | null;
  setRemovingIndex: (i: number | null) => void;
  confirmRemoveProperty: () => void;
  goDraft: () => void;
  createDraftFromVersion: () => void;
}) {
  const {type: t} = props;
  const badge = ORIGIN_BADGE[t.origin] ?? ORIGIN_BADGE.LOCAL;

  return (
    <div className="space-y-4">
      <ReadOnlyNote
        reason={props.readOnlyReason}
        isDraft={props.isDraft}
        hasDraftChangeSet={props.hasDraftChangeSet}
        canEdit={props.canEdit}
        draftBusy={props.draftBusy}
        createPending={props.createPending}
        goDraft={props.goDraft}
        createDraftFromVersion={props.createDraftFromVersion}
      />

      {t.origin === 'EXTERNAL' && (
        <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px] text-amber-800">
          <ExternalLink className="h-4 w-4 shrink-0 mt-0.5"/>
          <div>
            <p className="font-bold">外部类型引用（origin=EXTERNAL，只读）</p>
            <p className="mt-0.5">
              权威定义在外部契约包
              {t.externalContract && (
                <span className="font-mono"> {t.externalContract.packageId}/{t.externalContract.typeId}@{t.externalContract.versionId ?? '未固定'} </span>
              )}
              ，只能升级固定版本引用；直接改写定义会被服务端拒绝（EXTERNAL_READ_ONLY）。
            </p>
          </div>
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {props.editingBasic ? (
              <div className="space-y-2.5 w-full max-w-lg">
                <input
                  value={props.basicDraft.nameCn}
                  onChange={(e) => props.setBasicDraft({...props.basicDraft, nameCn: e.target.value})}
                  placeholder="类型名称" className="input"
                />
                <textarea
                  value={props.basicDraft.definition}
                  onChange={(e) => props.setBasicDraft({...props.basicDraft, definition: e.target.value})}
                  placeholder="定义说明" rows={2} className="input"
                />
                <div className="flex gap-2">
                  <button onClick={props.submitBasic} disabled={props.saving} className="btn-primary">
                    {props.saving && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}保存到草稿
                  </button>
                  <button onClick={props.cancelEditBasic} className="btn-ghost">取消</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-800">{t.nameCn}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>{badge.label}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-1">{t.id} · 分组 {t.group} · 责任方 {t.ownerService}</p>
                <p className="text-[12.5px] text-slate-600 mt-2 leading-relaxed">{t.definition}</p>
              </>
            )}
          </div>
          {!props.editingBasic && props.editable && (
            <button
              onClick={props.startEditBasic}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 shrink-0"
            >
              <Pencil className="h-3.5 w-3.5"/>编辑信息
            </button>
          )}
        </div>
      </div>

      {/* 属性 */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-[13px] font-bold text-slate-700">
            属性定义 <span className="font-mono text-slate-400">({t.properties.length})</span>
          </h3>
          {props.editable && (
            <button
              onClick={props.openAddProperty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5"/>添加属性
            </button>
          )}
        </div>
        {t.properties.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-slate-400">
            该类型暂无属性{props.editable ? '，点击右上角“添加属性”创建。' : '。'}
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-wide">
                <th className="text-left px-5 py-2 font-bold">code</th>
                <th className="text-left px-3 py-2 font-bold">名称</th>
                <th className="text-left px-3 py-2 font-bold">值类型</th>
                <th className="text-left px-3 py-2 font-bold">必填</th>
                <th className="text-left px-3 py-2 font-bold">身份键</th>
                <th className="text-left px-3 py-2 font-bold">枚举</th>
                <th className="text-left px-3 py-2 font-bold">定义</th>
                {props.editable && <th className="px-5 py-2"/>}
              </tr>
            </thead>
            <tbody>
              {t.properties.map((p, i) => (
                <tr key={`${p.code}-${i}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-2.5 font-mono font-bold text-slate-700">{p.code}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.nameCn}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10.5px] text-slate-600">{p.valueType}</span>
                  </td>
                  <td className="px-3 py-2.5">{p.required ? <span className="text-red-500 font-bold">必填</span> : <span className="text-slate-400">可选</span>}</td>
                  <td className="px-3 py-2.5">{p.isIdentity ? <span className="text-blue-600 font-bold">是</span> : <span className="text-slate-400">—</span>}</td>
                  <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{p.enumValues?.length ? p.enumValues.join(' | ') : '—'}</td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-[260px] truncate" title={p.definition}>{p.definition}</td>
                  {props.editable && (
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {props.removingIndex === i ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-[10.5px] text-red-600 font-bold">移除 {p.code}？</span>
                          <button onClick={props.confirmRemoveProperty} className="px-2 py-0.5 text-[10.5px] font-bold bg-red-600 text-white rounded-md">确认</button>
                          <button onClick={() => props.setRemovingIndex(null)} className="px-2 py-0.5 text-[10.5px] font-bold bg-slate-100 text-slate-600 rounded-md">取消</button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <button
                            onClick={() => props.openEditProperty(p, i)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                            title="编辑属性"
                          ><Pencil className="h-3.5 w-3.5"/></button>
                          <button
                            onClick={() => props.setRemovingIndex(i)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                            title="移除属性（UPSERT 不含该属性）"
                          ><Trash2 className="h-3.5 w-3.5"/></button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 属性编辑弹层 */}
      {props.propModal && (
        <Modal
          title={props.propModal.mode === 'add' ? '添加属性' : `编辑属性 ${props.propModal.initial?.code ?? ''}`}
          subtitle="属性定义按合同字段（code / 值类型 / 必填 / 身份键 / 枚举 / 定义）保存。语义类型与置信度不属于属性定义：UNKNOWN 是“证据不足”的语义值、IGNORE 是字段角色标记，均非生命周期状态。"
          onClose={props.closeProperty}
        >
          <div className="space-y-3">
            <InputField label="code" hint="字母开头，可含数字与 _ . : -">
              <input
                value={props.propDraft.code}
                onChange={(e) => props.setPropDraft({...props.propDraft, code: e.target.value})}
                disabled={props.propModal.mode === 'edit'}
                placeholder="例如 supplier_name" className="input font-mono"
              />
            </InputField>
            <InputField label="名称（中文）">
              <input
                value={props.propDraft.nameCn}
                onChange={(e) => props.setPropDraft({...props.propDraft, nameCn: e.target.value})}
                placeholder="例如 供应商名称" className="input"
              />
            </InputField>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="值类型">
                <select
                  value={props.propDraft.valueType}
                  onChange={(e) => props.setPropDraft({...props.propDraft, valueType: e.target.value as PropertyDefinition['valueType']})}
                  className="input"
                >
                  {VALUE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </InputField>
              <InputField label="枚举值（可选）" hint="逗号分隔">
                <input
                  value={props.propDraft.enumValues}
                  onChange={(e) => props.setPropDraft({...props.propDraft, enumValues: e.target.value})}
                  placeholder="例如 ACTIVE, SUSPENDED" className="input font-mono"
                />
              </InputField>
            </div>
            <div className="flex items-center gap-5">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={props.propDraft.required}
                  onChange={(e) => props.setPropDraft({...props.propDraft, required: e.target.checked})}/>
                必填 required
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={props.propDraft.isIdentity}
                  onChange={(e) => props.setPropDraft({...props.propDraft, isIdentity: e.target.checked})}/>
                身份键 isIdentity
              </label>
            </div>
            <InputField label="定义说明">
              <textarea
                value={props.propDraft.definition}
                onChange={(e) => props.setPropDraft({...props.propDraft, definition: e.target.value})}
                rows={2} className="input"
              />
            </InputField>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={props.closeProperty} className="btn-ghost">取消</button>
            <button onClick={props.submitProperty} disabled={props.saving} className="btn-primary">
              {props.saving && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}
              {props.propModal.mode === 'add' ? '添加属性' : '保存属性'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({title, subtitle, onClose, children}: {title: string; subtitle?: string; onClose: () => void; children: ReactNode}) {
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

function InputField({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}
