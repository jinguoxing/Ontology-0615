/**
 * 类型使用统计（Batch 4.5 第五节）。
 *
 * 用当前 ResolvedView.document 实时计算某个对象类型在本模型中的使用情况：
 * - 入向关系：relations 中 targetTypeId 命中该类型；
 * - 出向关系：relations 中 sourceTypeId 命中该类型；
 * - 约束：constraints 中 targetTypeId 命中该类型；
 * - 行动契约：actions 的 inputTypeIds / outputTypeIds 命中该类型；
 * - 流程引用：workflowRefs → requiredActionIds → 对应行动的输入 / 输出类型
 *   间接命中该类型（流程不直接引用类型，必须经行动契约推导）。
 * 不新增接口、不伪造数据；数量仅来自当前视图。点击统计项进入对应能力页。
 */
import {useMemo} from 'react';
import {ArrowDownRight, ArrowUpRight, ScrollText, ShieldCheck, Workflow, Zap} from 'lucide-react';
import type {ModelDocument} from '../api/ontology-v1/types.generated';
import type {OntologyTab} from '../api/ontology-v1/routeContext';

interface UsageDatum {
  key: string;
  label: string;
  count: number;
  names: string[];
  tab: OntologyTab;
  icon: typeof Zap;
}

export default function TypeUsageSummary({typeId, doc, onGoTab}: {
  typeId: string;
  doc: ModelDocument | undefined;
  onGoTab: (tab: OntologyTab) => void;
}) {
  const usage = useMemo<UsageDatum[]>(() => {
    if (!doc) return [];
    const incoming = doc.relations.filter((r) => r.targetTypeId === typeId);
    const outgoing = doc.relations.filter((r) => r.sourceTypeId === typeId);
    const constraints = doc.constraints.filter((c) => c.targetTypeId === typeId);
    const actions = doc.actions.filter((a) => a.inputTypeIds.includes(typeId) || a.outputTypeIds.includes(typeId));
    // 流程引用经行动契约间接使用类型：requiredActionIds → 行动输入 / 输出。
    const actionById = new Map(doc.actions.map((a) => [a.id, a] as const));
    const workflows = doc.workflowRefs.filter((w) =>
      w.requiredActionIds.some((actionId) => {
        const a = actionById.get(actionId);
        return a !== undefined && (a.inputTypeIds.includes(typeId) || a.outputTypeIds.includes(typeId));
      }),
    );
    return [
      {key: 'incoming', label: '入向关系', count: incoming.length, names: incoming.map((r) => r.nameCn), tab: 'relations', icon: ArrowDownRight},
      {key: 'outgoing', label: '出向关系', count: outgoing.length, names: outgoing.map((r) => r.nameCn), tab: 'relations', icon: ArrowUpRight},
      {key: 'constraints', label: '约束', count: constraints.length, names: constraints.map((c) => c.nameCn), tab: 'relations', icon: ShieldCheck},
      {key: 'actions', label: '行动契约', count: actions.length, names: actions.map((a) => a.nameCn), tab: 'actions', icon: Zap},
      {key: 'workflows', label: '流程引用', count: workflows.length, names: workflows.map((w) => w.workflowId), tab: 'workflows', icon: Workflow},
      {key: 'bindings', label: '实现绑定', count: doc.implementationBindings.filter((b) => b.actionId !== undefined && actions.some((a) => a.id === b.actionId)).length, names: [], tab: 'implementations', icon: ScrollText},
    ];
  }, [doc, typeId]);

  if (!doc) return null;

  return (
    <div className="semovix-card px-4 py-3" data-testid="type-usage-summary">
      <p className="text-[12px] font-bold text-slate-500 mb-2">使用情况 <span className="font-normal text-slate-400">（按当前视图实时计算）</span></p>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {usage.map((u) => (
          <button
            key={u.key}
            onClick={() => onGoTab(u.tab)}
            className="text-left px-2.5 py-2 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            title={u.names.length > 0 ? u.names.join('、') : (u.count > 0 ? '' : '当前视图中没有直接使用')}
          >
            <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-500">
              <u.icon className="h-3 w-3 text-slate-400"/>{u.label}
            </span>
            <span className={`block font-mono font-bold mt-0.5 ${u.count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{u.count}</span>
            {u.names.length > 0 && (
              <span className="block text-[12px] text-slate-400 truncate" title={u.names.join('、')}>
                {u.names.slice(0, 2).join('、')}{u.names.length > 2 ? ' 等' : ''}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
