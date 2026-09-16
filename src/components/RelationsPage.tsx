/**
 * 关系与约束页（Batch 3 · 04；Batch 3.5 结构对齐）。
 *
 * - 读取：GET /models/:id/relations 与 GET /models/:id/constraints（同一
 *   ViewReference）；端点类型的名称 / origin 取自同一视图的 objectTypes。
 * - 表格视图 / 结构视图共用同一主区域（默认表格），与 Inspector 消费同一份
 *   relations 查询（单一数据源）；七类关系只用于筛选与轻量标识。
 * - 下方只显示当前选中关系端点上的相关约束摘要；“查看全部约束”在抽屉中
 *   展示完整约束表（含编辑）。
 * - 写入：UPSERT / REMOVE 经 POST /changesets/:id/operations（If-Match +
 *   Idempotency-Key）；外部类型（EXTERNAL）可作为关系端点，但其自身定义
 *   仍不可编辑（服务端 EXTERNAL_READ_ONLY）。删除关系只写入 REMOVE 操作，
 *   不级联删除约束。
 * - 约束区分 MODEL_DEFINITION（模型定义）与 GOVERNANCE_RECORD（治理记录）：
 *   Mock 环境下治理记录仅保证规则定义有效，不宣称治理实例已经验证。
 * - selected 参数：关系直接使用其 id；约束使用 "c:" 前缀（c:<id>），刷新可复现。
 */
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {
  AlertTriangle,
  ExternalLink,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Table2,
  Trash2,
} from 'lucide-react';
import type {
  ConstraintDefinition,
  ObjectTypeDefinition,
  RelationDefinition,
} from '../api/ontology-v1/types.generated';
import {
  useActorScope,
  useConstraints,
  useRelations,
} from '../ontology/queries';
import {editPolicy} from '../ontology/editability';
import {useModelContext} from '../ontology/ModelContext';
import {
  DraftGateNotice,
  DraftTargetNote,
  Drawer,
  FormStyles,
  InputField,
  Modal,
  useDraftWrite,
  useEnterDraft,
  WriteBanners,
} from '../ontology/draftWrite';

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;

const RELATION_CATEGORIES: Array<{id: RelationDefinition['category']; label: string; cls: string; edge: string}> = [
  {id: 'CONTAINMENT', label: '包含', cls: 'bg-blue-50 text-blue-700 border-blue-200', edge: '#2563eb'},
  {id: 'SEMANTIC', label: '语义', cls: 'bg-violet-50 text-violet-700 border-violet-200', edge: '#7c3aed'},
  {id: 'QUALITY', label: '质量', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', edge: '#059669'},
  {id: 'EVIDENCE', label: '证据', cls: 'bg-amber-50 text-amber-700 border-amber-200', edge: '#d97706'},
  {id: 'PROVENANCE', label: '溯源', cls: 'bg-slate-100 text-slate-600 border-slate-300', edge: '#475569'},
  {id: 'DATA_GROUNDING', label: '数据落位', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200', edge: '#0891b2'},
  {id: 'OWNERSHIP', label: '归属', cls: 'bg-rose-50 text-rose-700 border-rose-200', edge: '#e11d48'},
];

const CATEGORY_BY_ID = new Map(RELATION_CATEGORIES.map((c) => [c.id, c]));

const SCOPE_BADGE: Record<ConstraintDefinition['scope'], {label: string; cls: string}> = {
  MODEL_DEFINITION: {label: '模型定义', cls: 'bg-blue-50 text-blue-700 border-blue-200'},
  GOVERNANCE_RECORD: {label: '治理记录', cls: 'bg-amber-50 text-amber-700 border-amber-200'},
};

interface RelationDraft {
  id: string;
  code: string;
  nameCn: string;
  category: RelationDefinition['category'];
  sourceTypeId: string;
  targetTypeId: string;
  sourceMin: string;
  sourceMax: string;
  targetMin: string;
  targetMax: string;
  definition: string;
}

function draftFromRelation(r: RelationDefinition): RelationDraft {
  return {
    id: r.id, code: r.code, nameCn: r.nameCn, category: r.category,
    sourceTypeId: r.sourceTypeId, targetTypeId: r.targetTypeId,
    sourceMin: String(r.sourceCardinality.min), sourceMax: r.sourceCardinality.max === null ? '' : String(r.sourceCardinality.max),
    targetMin: String(r.targetCardinality.min), targetMax: r.targetCardinality.max === null ? '' : String(r.targetCardinality.max),
    definition: r.definition,
  };
}

function parseCardinality(min: string, max: string): {min: number; max: number | null} | string {
  const mn = Number(min);
  if (!Number.isInteger(mn) || mn < 0) return '基数 min 需为非负整数';
  if (max.trim() === '') return {min: mn, max: null};
  const mx = Number(max);
  if (!Number.isInteger(mx) || mx < mn) return '基数 max 需为空（无上限）或不小于 min 的整数';
  return {min: mn, max: mx};
}

export default function RelationsPage() {
  const ctx = useModelContext();
  const {route, resolvedView, model, isDraft, selectedId, select, navigateToView, modelId, capabilities} = ctx;
  const scope = useActorScope();
  const relationsQuery = useRelations(scope, modelId, ctx.view);
  const constraintsQuery = useConstraints(scope, modelId, ctx.view);
  const types = useMemo(() => resolvedView?.document.objectTypes ?? [], [resolvedView]);
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

  // 关系 / 约束是模型自有定义（无 origin 字段）；视图与权限门槛沿用统一策略，
  // 服务端保持最终裁决（403 / 412 / 422）。端点为 EXTERNAL 不影响关系本身可编辑。
  const editState = editPolicy({origin: 'LOCAL', model, view: resolvedView, capabilities});
  const editable = editState.editable;
  const draftId = isDraft && 'changeSetId' in route.view ? route.view.changeSetId : null;

  const w = useDraftWrite({scope, modelId, resolvedView, draftId, selectedId, navigateToView});
  const enter = useEnterDraft({scope, modelId, model, resolvedView, selectedId, navigateToView});

  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RelationDefinition['category'] | 'ALL'>('ALL');
  // 表格视图 / 结构视图共用同一主区域（默认表格）。
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
  const [allConstraintsOpen, setAllConstraintsOpen] = useState(false);
  const [relModal, setRelModal] = useState<{mode: 'add' | 'edit'} | null>(null);
  const [relDraft, setRelDraft] = useState<RelationDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [constraintEdit, setConstraintEdit] = useState<ConstraintDefinition | null>(null);
  const [constraintDraft, setConstraintDraft] = useState({nameCn: '', definition: '', expression: ''});
  const [constraintError, setConstraintError] = useState<string | null>(null);

  // selected 约定：关系用原始 id；约束加 "c:" 前缀，二者共享一个 URL 参数。
  const selConstraintId = selectedId?.startsWith('c:') ? selectedId.slice(2) : undefined;
  const selRelationId = selectedId && !selectedId.startsWith('c:') ? selectedId : undefined;

  const relations = relationsQuery.data?.items ?? [];
  const constraints = constraintsQuery.data?.items ?? [];

  const categoryCounts = useMemo(() => {
    const counts = new Map<RelationDefinition['category'], number>();
    for (const r of relations) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return counts;
  }, [relations]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return relations.filter((r) => {
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (!q) return true;
      return r.id.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.nameCn.includes(filter.trim())
        || r.sourceTypeId.toLowerCase().includes(q) || r.targetTypeId.toLowerCase().includes(q);
    });
  }, [relations, filter, categoryFilter]);

  const current = selRelationId ? relations.find((r) => r.id === selRelationId) : undefined;
  const currentConstraint = selConstraintId ? constraints.find((c) => c.id === selConstraintId) : undefined;

  // 当前关系端点上的相关约束（约束的 targetTypeId 命中源 / 目标类型）。
  const relatedConstraints = useMemo(() => {
    if (!current) return [];
    return constraints.filter(
      (c) => c.targetTypeId === current.sourceTypeId || c.targetTypeId === current.targetTypeId,
    );
  }, [constraints, current]);

  // 打开编辑弹层时同步表单；关闭时清理，避免残留上一次的输入。
  useEffect(() => {
    if (relModal?.mode === 'edit' && current) setRelDraft(draftFromRelation(current));
    if (relModal?.mode === 'add') {
      setRelDraft({
        id: '', code: '', nameCn: '', category: 'SEMANTIC',
        sourceTypeId: types[0]?.id ?? '', targetTypeId: types[1]?.id ?? '',
        sourceMin: '0', sourceMax: '', targetMin: '1', targetMax: '1',
        definition: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relModal, current]);

  const submitRelation = () => {
    if (!relDraft) return;
    setFormError(null);
    if (relModal?.mode === 'add') {
      if (!ID_PATTERN.test(relDraft.id)) {setFormError('关系 ID 需以字母开头，可含数字与 _ . : -'); return;}
      if (relations.some((r) => r.id === relDraft.id)) {setFormError(`关系 ${relDraft.id} 已存在`); return;}
    }
    if (!relDraft.nameCn.trim()) {setFormError('请填写关系名称'); return;}
    if (!relDraft.sourceTypeId || !relDraft.targetTypeId) {setFormError('请选择源类型与目标类型'); return;}
    if (!typeById.has(relDraft.sourceTypeId) || !typeById.has(relDraft.targetTypeId)) {setFormError('端点类型必须存在于当前视图'); return;}
    const sourceCardinality = parseCardinality(relDraft.sourceMin, relDraft.sourceMax);
    if (typeof sourceCardinality === 'string') {setFormError(`源端：${sourceCardinality}`); return;}
    const targetCardinality = parseCardinality(relDraft.targetMin, relDraft.targetMax);
    if (typeof targetCardinality === 'string') {setFormError(`目标端：${targetCardinality}`); return;}
    const definition: RelationDefinition = {
      id: relDraft.id,
      code: relModal?.mode === 'add' ? (relDraft.code.trim() || relDraft.id) : relDraft.code,
      nameCn: relDraft.nameCn.trim(),
      category: relDraft.category,
      sourceTypeId: relDraft.sourceTypeId,
      targetTypeId: relDraft.targetTypeId,
      sourceCardinality,
      targetCardinality,
      definition: relDraft.definition.trim() || `${relDraft.nameCn.trim()} 的关系定义`,
    };
    w.save(
      [{op: 'UPSERT', collection: 'relations', id: definition.id, value: definition}],
      relModal?.mode === 'add' ? `新增关系 ${definition.id}` : `修改关系 ${definition.id}`,
      {selectedId: definition.id},
    );
    setRelModal(null);
  };

  const confirmRemove = () => {
    if (!current || !removing) return;
    w.save(
      [{op: 'REMOVE', collection: 'relations', id: current.id}],
      `移除关系 ${current.id}（仅写入 REMOVE 操作，不级联删除约束）`,
      {selectedId: null},
    );
    setRemoving(null);
  };

  const submitConstraint = () => {
    if (!constraintEdit) return;
    setConstraintError(null);
    if (!constraintDraft.nameCn.trim()) {setConstraintError('请填写约束名称'); return;}
    let expression: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(constraintDraft.expression || '{}');
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setConstraintError('约束 expression 需为 JSON 对象'); return;
      }
      expression = parsed as Record<string, unknown>;
    } catch {
      setConstraintError('约束 expression 不是合法 JSON'); return;
    }
    const next: ConstraintDefinition = {
      ...constraintEdit,
      nameCn: constraintDraft.nameCn.trim(),
      definition: constraintDraft.definition.trim() || constraintEdit.definition,
      expression,
    };
    w.save(
      [{op: 'UPSERT', collection: 'constraints', id: next.id, value: next}],
      `修改约束 ${next.id}`,
      {selectedId: `c:${next.id}`},
    );
    setConstraintEdit(null);
  };

  return (
    <div className="space-y-4">
      <FormStyles/>
      <WriteBanners w={w}/>
      {enter.error && (
        <p className="px-4 py-2.5 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl">{enter.error}</p>
      )}
      <DraftGateNotice reason={editState.reason} canEdit={ctx.canEdit} enter={enter}/>
      {isDraft && draftId && editable && <DraftTargetNote draftId={draftId} revision={resolvedView?.revision}/>}

      {relationsQuery.isLoading || constraintsQuery.isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500"/>
          <p className="text-xs">正在读取关系与约束…</p>
        </div>
      ) : relationsQuery.isError || constraintsQuery.isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-2 text-[12.5px] text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5"/>
          <p>{relationsQuery.isError ? (relationsQuery.error as Error).message : (constraintsQuery.error as Error).message}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col xl:flex-row gap-4 items-start">
            {/* 主区域：表格视图 / 结构视图共用（默认表格） */}
            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden w-full">
              <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-[13px] font-bold text-slate-700">
                    关系定义 <span className="font-mono text-slate-400">({relations.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* 表格视图 / 结构视图切换：同一主区域 */}
                    <div className="inline-flex items-center rounded-lg border border-slate-200 overflow-hidden" data-testid="relation-view-toggle">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-bold transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                      ><Table2 className="h-3 w-3"/>表格视图</button>
                      <button
                        onClick={() => setViewMode('graph')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-bold transition-colors border-l border-slate-200 ${viewMode === 'graph' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                      ><Share2 className="h-3 w-3"/>结构视图</button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                      <input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="按 ID / 名称 / 端点过滤"
                        className="pl-8 pr-2 py-1.5 text-[11.5px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-52"
                      />
                    </div>
                    {editable && (
                      <button
                        onClick={() => {setRelModal({mode: 'add'}); setFormError(null);}}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-3.5 w-3.5"/>新增关系
                      </button>
                    )}
                  </div>
                </div>
                {/* 七类关系只用于筛选与轻量标识 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-2 py-0.5 rounded-full text-[12px] font-bold border ${categoryFilter === 'ALL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                  >全部 {relations.length}</button>
                  {RELATION_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategoryFilter(c.id)}
                      className={`px-2 py-0.5 rounded-full text-[12px] font-bold border ${categoryFilter === c.id ? 'bg-blue-600 text-white border-blue-600' : `${c.cls} hover:opacity-80`}`}
                    >
                      {c.label} {categoryCounts.get(c.id) ?? 0}
                    </button>
                  ))}
                </div>
              </div>
              {viewMode === 'table' ? (
                <div className="overflow-auto max-h-[46vh]" data-testid="relation-table">
                  <table className="w-full text-xs min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-wide sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                        <th className="text-left px-4 py-2 font-bold">关系</th>
                        <th className="text-left px-3 py-2 font-bold">源类型</th>
                        <th className="text-left px-3 py-2 font-bold">目标类型</th>
                        <th className="text-left px-3 py-2 font-bold">类别</th>
                        <th className="text-left px-3 py-2 font-bold">基数（源 / 目标）</th>
                        {editable && <th className="px-4 py-2"/>}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const cat = CATEGORY_BY_ID.get(r.category);
                        const active = r.id === selRelationId;
                        return (
                          <tr
                            key={r.id}
                            onClick={() => {select(r.id); setRemoving(null);}}
                            className={`border-t border-slate-100 cursor-pointer ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}`}
                          >
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-slate-700">{r.nameCn}</p>
                              <p className="font-mono text-[9.5px] text-slate-400">{r.id}</p>
                            </td>
                            <td className="px-3 py-2.5"><TypeRef id={r.sourceTypeId} type={typeById.get(r.sourceTypeId)}/></td>
                            <td className="px-3 py-2.5"><TypeRef id={r.targetTypeId} type={typeById.get(r.targetTypeId)}/></td>
                            <td className="px-3 py-2.5">
                              {cat && <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${cat.cls}`}>{cat.label}</span>}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">
                              {fmtCard(r.sourceCardinality)} / {fmtCard(r.targetCardinality)}
                            </td>
                            {editable && (
                              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                <button
                                  onClick={(e) => {e.stopPropagation(); select(r.id); setRelModal({mode: 'edit'});}}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                  title="编辑关系"
                                ><Pencil className="h-3.5 w-3.5"/></button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr><td colSpan={editable ? 6 : 5} className="px-4 py-8 text-center text-slate-400">无匹配的关系</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div data-testid="relation-graph">
                  <div className="overflow-auto max-h-[46vh]">
                    <RelationsGraph
                      relations={filtered}
                      typeById={typeById}
                      selectedId={selRelationId}
                      onSelect={(id) => select(id)}
                    />
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                    {RELATION_CATEGORIES.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                        <span className="inline-block h-0.5 w-4 rounded" style={{background: c.edge}}/>{c.label}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] text-slate-400">节点 = 关系端点类型 · 连线颜色 = 类别 · 点击连线选中关系</span>
                  </div>
                </div>
              )}
            </div>

            {/* Inspector */}
            <aside className="w-full xl:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              {!current ? (
                <div className="py-12 text-center space-y-2">
                  <LayoutGrid className="h-6 w-6 text-slate-200 mx-auto"/>
                  <p className="text-xs text-slate-400">在表格或结构视图中选择一个关系</p>
                  <p className="text-[10.5px] text-slate-300">Inspector 与两个视图读取同一份 relations 数据</p>
                </div>
              ) : (
                <RelationInspector
                  relation={current}
                  typeById={typeById}
                  editable={editable}
                  removing={removing === current.id}
                  onEdit={() => setRelModal({mode: 'edit'})}
                  onRemove={() => setRemoving(current.id)}
                  onCancelRemove={() => setRemoving(null)}
                  onConfirmRemove={confirmRemove}
                />
              )}
            </aside>
          </div>

          {/* 相关约束摘要：只显示当前关系端点上的约束；“查看全部约束”进抽屉 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400"/>
                相关约束
                <span className="font-mono text-slate-400">({relatedConstraints.length})</span>
              </h2>
              <button
                onClick={() => setAllConstraintsOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-800"
              >
                查看全部约束（{constraints.length}）
              </button>
            </div>
            {!current ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">选择一个关系后，这里显示其源 / 目标类型上挂载的约束摘要。</p>
            ) : relatedConstraints.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                关系 <span className="font-mono text-slate-500">{current.id}</span> 的端点类型（{current.sourceTypeId} / {current.targetTypeId}）上没有挂载约束；
                全部 {constraints.length} 条约束见「查看全部约束」。
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {relatedConstraints.map((c) => {
                  const badge = SCOPE_BADGE[c.scope];
                  return (
                    <div
                      key={c.id}
                      onClick={() => select(`c:${c.id}`)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${c.id === selConstraintId ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <span className="text-[12.5px] font-bold text-slate-700">{c.nameCn}</span>
                          <span className="ml-2 font-mono text-[9.5px] text-slate-400">{c.id}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        作用于端点 <TypeRef id={c.targetTypeId} type={typeById.get(c.targetTypeId)}/> ·
                        规则 <span className="font-mono text-slate-600">{c.ruleCode}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 全部约束（次级抽屉，含编辑入口） */}
      {allConstraintsOpen && (
        <Drawer
          title={`全部约束（${constraints.length}）`}
          subtitle="与关系读取同一视图。点击行选中；治理记录仅保证规则定义有效，不宣称治理实例已验证。"
          onClose={() => setAllConstraintsOpen(false)}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10.5px] uppercase tracking-wide">
                  <th className="text-left px-3 py-2 font-bold">约束</th>
                  <th className="text-left px-3 py-2 font-bold">范围</th>
                  <th className="text-left px-3 py-2 font-bold">目标类型</th>
                  <th className="text-left px-3 py-2 font-bold">规则</th>
                  {editable && <th className="px-3 py-2"/>}
                </tr>
              </thead>
              <tbody>
                {constraints.map((c) => {
                  const badge = SCOPE_BADGE[c.scope];
                  const active = c.id === selConstraintId;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => select(`c:${c.id}`)}
                      className={`border-t border-slate-100 cursor-pointer ${active ? 'bg-blue-50/70' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-700">{c.nameCn}</p>
                        <p className="font-mono text-[9.5px] text-slate-400">{c.id}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-3 py-2.5"><TypeRef id={c.targetTypeId} type={typeById.get(c.targetTypeId)}/></td>
                      <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-600">{c.ruleCode}</td>
                      {editable && (
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              select(`c:${c.id}`);
                              setConstraintEdit(c);
                              setConstraintDraft({nameCn: c.nameCn, definition: c.definition, expression: JSON.stringify(c.expression, null, 2)});
                              setConstraintError(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                            title="编辑约束"
                          ><Pencil className="h-3.5 w-3.5"/></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {constraints.length === 0 && (
                  <tr><td colSpan={editable ? 5 : 4} className="px-3 py-8 text-center text-slate-400">当前视图没有约束</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {currentConstraint && (
            <div className="mt-3 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p className="text-[12px] text-slate-700 leading-relaxed">{currentConstraint.definition}</p>
              {currentConstraint.scope === 'GOVERNANCE_RECORD' ? (
                <p className="flex items-start gap-1.5 text-[11px] text-amber-700">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
                  治理记录：演示环境仅保证规则定义有效（表达式可解析、目标存在），
                  不宣称治理实例已经验证或满足——实例验证需要真实治理运行时（本演示未连接）。
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">模型定义约束：约束随模型定义一起版本化。</p>
              )}
            </div>
          )}
        </Drawer>
      )}

      {/* 关系编辑弹层 */}
      {relModal && relDraft && (
        <Modal
          title={relModal.mode === 'add' ? '新增关系' : `编辑关系 ${relDraft.id}`}
          subtitle="修改将写入当前草稿。外部引用类型可作为端点，但其类型定义本身不可编辑。"
          onClose={() => setRelModal(null)}
        >
          <div className="space-y-3">
            {relModal.mode === 'add' && (
              <div className="grid grid-cols-2 gap-3">
                <InputField label="关系 ID" hint="字母开头，可含数字与 _ . : -">
                  <input value={relDraft.id} onChange={(e) => setRelDraft({...relDraft, id: e.target.value})} placeholder="例如 consumesMetric" className="input font-mono"/>
                </InputField>
                <InputField label="关系代码" hint="留空则使用 ID">
                  <input value={relDraft.code} onChange={(e) => setRelDraft({...relDraft, code: e.target.value})} placeholder="consumesMetric" className="input font-mono"/>
                </InputField>
              </div>
            )}
            <InputField label="名称（中文）">
              <input value={relDraft.nameCn} onChange={(e) => setRelDraft({...relDraft, nameCn: e.target.value})} className="input"/>
            </InputField>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="源类型">
                <TypeSelect value={relDraft.sourceTypeId} types={types} onChange={(v) => setRelDraft({...relDraft, sourceTypeId: v})}/>
              </InputField>
              <InputField label="目标类型">
                <TypeSelect value={relDraft.targetTypeId} types={types} onChange={(v) => setRelDraft({...relDraft, targetTypeId: v})}/>
              </InputField>
            </div>
            <InputField label="类别">
              <select value={relDraft.category} onChange={(e) => setRelDraft({...relDraft, category: e.target.value as RelationDefinition['category']})} className="input">
                {RELATION_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.id}（{c.label}）</option>)}
              </select>
            </InputField>
            <div className="grid grid-cols-4 gap-2">
              <InputField label="源 min"><input value={relDraft.sourceMin} onChange={(e) => setRelDraft({...relDraft, sourceMin: e.target.value})} className="input font-mono"/></InputField>
              <InputField label="源 max" hint="空 = 无上限"><input value={relDraft.sourceMax} onChange={(e) => setRelDraft({...relDraft, sourceMax: e.target.value})} className="input font-mono"/></InputField>
              <InputField label="目标 min"><input value={relDraft.targetMin} onChange={(e) => setRelDraft({...relDraft, targetMin: e.target.value})} className="input font-mono"/></InputField>
              <InputField label="目标 max" hint="空 = 无上限"><input value={relDraft.targetMax} onChange={(e) => setRelDraft({...relDraft, targetMax: e.target.value})} className="input font-mono"/></InputField>
            </div>
            <InputField label="定义说明">
              <textarea value={relDraft.definition} onChange={(e) => setRelDraft({...relDraft, definition: e.target.value})} rows={2} className="input"/>
            </InputField>
            {formError && <p className="text-[11.5px] text-red-600">{formError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setRelModal(null)} className="btn-ghost">取消</button>
            <button onClick={submitRelation} disabled={w.saving} className="btn-primary">
              {w.saving && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}{relModal.mode === 'add' ? '创建关系' : '保存关系'}
            </button>
          </div>
        </Modal>
      )}

      {/* 约束编辑弹层 */}
      {constraintEdit && (
        <Modal
          title={`编辑约束 ${constraintEdit.id}`}
          subtitle={`修改将写入当前草稿（${SCOPE_BADGE[constraintEdit.scope].label}）。${constraintEdit.scope === 'GOVERNANCE_RECORD' ? '演示环境仅校验规则定义，不验证治理实例。' : ''}`}
          onClose={() => setConstraintEdit(null)}
        >
          <div className="space-y-3">
            <InputField label="名称（中文）">
              <input value={constraintDraft.nameCn} onChange={(e) => setConstraintDraft({...constraintDraft, nameCn: e.target.value})} className="input"/>
            </InputField>
            <InputField label="定义说明">
              <textarea value={constraintDraft.definition} onChange={(e) => setConstraintDraft({...constraintDraft, definition: e.target.value})} rows={2} className="input"/>
            </InputField>
            <InputField label="约束表达式（JSON 对象）">
              <textarea value={constraintDraft.expression} onChange={(e) => setConstraintDraft({...constraintDraft, expression: e.target.value})} rows={6} className="input font-mono text-[11px]"/>
            </InputField>
            <p className="text-[10.5px] text-slate-400">规则 <span className="font-mono">{constraintEdit.ruleCode}</span> · 目标类型 <span className="font-mono">{constraintEdit.targetTypeId}</span>（只读，随规则定义）</p>
            {constraintError && <p className="text-[11.5px] text-red-600">{constraintError}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setConstraintEdit(null)} className="btn-ghost">取消</button>
            <button onClick={submitConstraint} disabled={w.saving} className="btn-primary">
              {w.saving && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}保存约束
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function fmtCard(c: {min: number; max: number | null}): string {
  return `${c.min}..${c.max === null ? '*' : c.max}`;
}

function TypeRef({id, type}: {id: string; type: ObjectTypeDefinition | undefined}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-slate-700">{type?.nameCn ?? id}</span>
      {type?.origin === 'EXTERNAL' && <span title="外部引用（origin=EXTERNAL）"><ExternalLink className="h-3 w-3 text-amber-500"/></span>}
      <span className="font-mono text-[9.5px] text-slate-400">{id}</span>
    </span>
  );
}

function TypeSelect({value, types, onChange}: {value: string; types: ObjectTypeDefinition[]; onChange: (v: string) => void}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      <option value="">— 选择类型 —</option>
      {types.map((t) => (
        <option key={t.id} value={t.id}>{t.nameCn}（{t.id}{t.origin === 'EXTERNAL' ? ' · 外部引用' : ''}）</option>
      ))}
    </select>
  );
}

function RelationInspector({relation, typeById, editable, removing, onEdit, onRemove, onCancelRemove, onConfirmRemove}: {
  relation: RelationDefinition;
  typeById: Map<string, ObjectTypeDefinition>;
  editable: boolean;
  removing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
}) {
  const cat = CATEGORY_BY_ID.get(relation.category);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">{relation.nameCn}</h3>
          <p className="font-mono text-[10.5px] text-slate-400">{relation.id} · code {relation.code}</p>
        </div>
        {cat && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${cat.cls}`}>{cat.label}</span>}
      </div>
      <div className="space-y-2 text-[12px]">
        <InspectorRow label="源类型"><TypeRef id={relation.sourceTypeId} type={typeById.get(relation.sourceTypeId)}/></InspectorRow>
        <InspectorRow label="目标类型"><TypeRef id={relation.targetTypeId} type={typeById.get(relation.targetTypeId)}/></InspectorRow>
        <InspectorRow label="源端基数"><span className="font-mono text-slate-600">{fmtCard(relation.sourceCardinality)}</span></InspectorRow>
        <InspectorRow label="目标端基数"><span className="font-mono text-slate-600">{fmtCard(relation.targetCardinality)}</span></InspectorRow>
        <InspectorRow label="类别">{cat && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.cls}`}>{cat.label}</span>}</InspectorRow>
      </div>
      <p className="text-[12px] text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">{relation.definition}</p>
      {editable && (
        <div className="flex items-center gap-2 pt-1">
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
            <Pencil className="h-3.5 w-3.5"/>编辑关系
          </button>
          {removing ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[10.5px] text-red-600 font-bold">移除？（不级联删除约束）</span>
              <button onClick={onConfirmRemove} className="px-2 py-0.5 text-[10.5px] font-bold bg-red-600 text-white rounded-md">确认</button>
              <button onClick={onCancelRemove} className="px-2 py-0.5 text-[10.5px] font-bold bg-slate-100 text-slate-600 rounded-md">取消</button>
            </span>
          ) : (
            <button onClick={onRemove} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
              <Trash2 className="h-3.5 w-3.5"/>移除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InspectorRow({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-400 text-[11px] font-semibold shrink-0">{label}</span>
      <span className="text-right min-w-0">{children}</span>
    </div>
  );
}

/** 简单椭圆布局关系图：节点 = 关系端点类型，连线颜色 = 类别；点击连线选中关系。 */
function RelationsGraph({relations, typeById, selectedId, onSelect}: {
  relations: RelationDefinition[];
  typeById: Map<string, ObjectTypeDefinition>;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const W = 940, H = 640, CX = W / 2, CY = H / 2, RX = 400, RY = 280;
  const layout = useMemo(() => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const r of relations) {
      for (const ep of [r.sourceTypeId, r.targetTypeId]) {
        if (!seen.has(ep)) {seen.add(ep); ids.push(ep);}
      }
    }
    const n = Math.max(ids.length, 1);
    const pos = new Map<string, {x: number; y: number}>();
    ids.forEach((id, i) => {
      const theta = (i / n) * Math.PI * 2 - Math.PI / 2;
      pos.set(id, {x: CX + RX * Math.cos(theta), y: CY + RY * Math.sin(theta)});
    });
    return pos;
  }, [relations]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{minWidth: 640, maxWidth: 1100, margin: '0 auto', display: 'block'}}>
      {relations.map((r) => {
        const a = layout.get(r.sourceTypeId);
        const b = layout.get(r.targetTypeId);
        if (!a || !b) return null;
        const cat = CATEGORY_BY_ID.get(r.category);
        const active = r.id === selectedId;
        return (
          <g key={r.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active ? cat?.edge ?? '#334155' : '#cbd5e1'} strokeWidth={active ? 2.5 : 1.2} opacity={active ? 1 : 0.75}/>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={9} style={{cursor: 'pointer'}} onClick={() => onSelect(r.id)}>
              <title>{`${r.nameCn}（${r.sourceTypeId} → ${r.targetTypeId}，${r.category}）`}</title>
            </line>
          </g>
        );
      })}
      {[...layout.entries()].map(([id, p]) => {
        const t = typeById.get(id);
        const external = t?.origin === 'EXTERNAL';
        const active = relations.some((r) => r.id === selectedId && (r.sourceTypeId === id || r.targetTypeId === id));
        const outward = {x: CX + (RX + 18) * ((p.x - CX) / RX), y: CY + (RY + 18) * ((p.y - CY) / RY)};
        return (
          <g key={id} style={{cursor: 'default'}}>
            <circle cx={p.x} cy={p.y} r={active ? 6 : 4.5} fill={external ? '#f59e0b' : '#334155'} stroke="white" strokeWidth={1.5}>
              <title>{`${t?.nameCn ?? id}（${id}${external ? ' · 外部引用' : ''}）`}</title>
            </circle>
            <text
              x={outward.x}
              y={outward.y}
              fontSize={10}
              fill={external ? '#b45309' : '#475569'}
              textAnchor={outward.x > CX + 20 ? 'start' : outward.x < CX - 20 ? 'end' : 'middle'}
              dominantBaseline="middle"
            >{t?.nameCn ?? id}</text>
          </g>
        );
      })}
    </svg>
  );
}
