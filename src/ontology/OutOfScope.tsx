/**
 * Semovix 规划模块的诚实占位页（Batch 3.6）。
 *
 * 用于当前仓库尚未实现的一级模块（Xino 智能伙伴 / 任务中心 / 智能体中心 /
 * 数据服务超市 / 数据治理 / 管理中心）与业务语义下尚未实现的子能力
 * （概览 / 业务域 / 业务术语 / 指标）。只说明该模块在当前演示范围外与
 * 演示聚焦点，不渲染任何伪造页面、占位数据或图表。
 */
import {Compass} from 'lucide-react';

export function OutOfScopePage({moduleLabel, groupLabel}: {moduleLabel: string; groupLabel?: string}) {
  return (
    <div className="px-8 py-10" data-testid="out-of-scope">
      <div className="max-w-xl bg-white border border-slate-200 rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Compass className="h-5 w-5 text-slate-400"/>
          <h1 className="text-lg font-bold text-slate-800">
            {groupLabel ? `${groupLabel} · ${moduleLabel}` : moduleLabel}
          </h1>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          当前演示范围外
        </span>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          「{moduleLabel}」属于 Semovix 平台的规划模块，当前仓库尚未实现该能力，
          因此这里不展示任何页面内容或数据。
        </p>
        <p className="text-[12px] text-slate-500 leading-relaxed">
          当前演示聚焦 <b>业务语义 → 业务本体</b>：本体的对象类型、关系与约束、
          行动契约、实现绑定与流程关联的版本化管理闭环。
        </p>
      </div>
    </div>
  );
}
