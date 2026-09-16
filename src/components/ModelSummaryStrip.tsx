/**
 * 模型摘要条（Batch 4.5 第四节）。
 *
 * 取代 Batch 2 的六张大 KPI 统计卡：同一行紧凑呈现当前视图
 * （ResolvedView.document）的构件计数，点击数字进入对应能力页。
 * 数量仍来自当前 ResolvedView.document，不引入合同之外的指标
 * （无实例数量、健康分等伪造统计）。
 */
import {
  Boxes,
  GitBranch,
  ScrollText,
  ShieldCheck,
  Workflow,
  Zap,
} from 'lucide-react';
import type {ModelDocument} from '../api/ontology-v1/types.generated';
import type {OntologyTab} from '../api/ontology-v1/routeContext';

export default function ModelSummaryStrip({doc, onGoTab}: {
  doc: ModelDocument | undefined;
  onGoTab: (tab: OntologyTab) => void;
}) {
  const local = doc ? doc.objectTypes.filter((t) => t.origin !== 'EXTERNAL').length : 0;
  const external = doc ? doc.objectTypes.length - local : 0;

  const items: {label: string; value: number | string; sub: string; tab: OntologyTab; icon: typeof Boxes}[] = [
    {label: '对象类型', value: doc?.objectTypes.length ?? '…', sub: `${local} 本地 + ${external} 外部引用`, tab: 'object-types', icon: Boxes},
    {label: '关系', value: doc?.relations.length ?? '…', sub: '关系定义', tab: 'relations', icon: GitBranch},
    {label: '约束', value: doc?.constraints.length ?? '…', sub: '约束定义', tab: 'relations', icon: ShieldCheck},
    {label: '行动契约', value: doc?.actions.length ?? '…', sub: '输入 / 输出类型契约', tab: 'actions', icon: Zap},
    {label: '实现绑定', value: doc?.implementationBindings.length ?? '…', sub: '登记实现绑定', tab: 'implementations', icon: ScrollText},
    {label: '流程引用', value: doc?.workflowRefs.length ?? '…', sub: '流程引用登记', tab: 'workflows', icon: Workflow},
  ];

  return (
    <div className="semovix-card flex flex-wrap divide-x divide-slate-100" data-testid="model-summary-strip">
      {items.map((s) => (
        <button
          key={s.label}
          onClick={() => onGoTab(s.tab)}
          className="flex-1 min-w-40 px-4 py-3 text-left hover:bg-slate-50 transition-colors group"
          title={`查看${s.label}`}
        >
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
            <s.icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500"/>{s.label}
          </span>
          <span className="block text-lg font-extrabold text-slate-800 mt-0.5 font-mono leading-tight">{s.value}</span>
          <span className="block text-[12px] text-slate-400 mt-0.5">{s.sub}</span>
        </button>
      ))}
    </div>
  );
}
