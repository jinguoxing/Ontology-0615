/**
 * 语义区域图（Batch 4.5 第四节）。
 *
 * 取代模型总览默认的全量节点交叉图（31 节点 / 39 关系的完整节点级关系图
 * 保留在「关系与约束」页的结构视图中）。这里按 ObjectTypeDefinition.group
 * 把当前视图（ResolvedView.document）聚合成语义区域：
 * - 每个区域显示类型计数摘要（本地 / 系统 / 外部引用）与类型名称摘要；
 * - 只显示区域级关系（关系定义按源 / 目标类型映射回所在区域聚合计数），
 *   不渲染节点级连线；
 * - 点击区域卡片 → 对象类型页并应用当前分组过滤（URL group 参数）；
 * - 点击关系摘要 → 关系与约束页。
 * 数量全部来自当前 ResolvedView.document 的实时计算，不缓存、不伪造。
 */
import {useMemo} from 'react';
import {ArrowRight, Boxes, ExternalLink, Map as MapIcon} from 'lucide-react';
import type {ModelDocument} from '../api/ontology-v1/types.generated';

interface RegionDatum {
  name: string;
  types: {id: string; nameCn: string; origin: string}[];
  localCount: number;
  systemCount: number;
  externalCount: number;
}

interface RegionLinkDatum {
  key: string;
  from: string;
  to: string;
  count: number;
}

export default function SemanticRegionMap({doc, onEnterRegion, onEnterRelations}: {
  doc: ModelDocument | undefined;
  /** 点击区域 → 对象类型页 + 分组过滤。 */
  onEnterRegion: (group: string) => void;
  /** 点击关系摘要 → 关系与约束页。 */
  onEnterRelations: () => void;
}) {
  const {regions, links} = useMemo(() => {
    if (!doc) return {regions: [] as RegionDatum[], links: [] as RegionLinkDatum[]};
    const byGroup = new Map<string, RegionDatum>();
    const groupOf = new Map<string, string>();
    for (const t of doc.objectTypes) {
      groupOf.set(t.id, t.group);
      const region = byGroup.get(t.group) ?? {name: t.group, types: [], localCount: 0, systemCount: 0, externalCount: 0};
      region.types.push({id: t.id, nameCn: t.nameCn, origin: t.origin});
      if (t.origin === 'EXTERNAL') region.externalCount += 1;
      else if (t.origin === 'SYSTEM') region.systemCount += 1;
      else region.localCount += 1;
      byGroup.set(t.group, region);
    }
    // 区域级关系：关系定义按源 / 目标类型映射回区域聚合（同区域内部关系不进列表）。
    const linkCounts = new Map<string, number>();
    for (const r of doc.relations) {
      const from = groupOf.get(r.sourceTypeId);
      const to = groupOf.get(r.targetTypeId);
      if (!from || !to || from === to) continue;
      const key = `${from}→${to}`;
      linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1);
    }
    const linkList = [...linkCounts.entries()]
      .map(([key, count]) => {
        const [from, to] = key.split('→');
        return {key, from, to, count};
      })
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
    return {
      regions: [...byGroup.values()].sort((a, b) => b.types.length - a.types.length || a.name.localeCompare(b.name)),
      links: linkList,
    };
  }, [doc]);

  // 区域内关系数（不跨区域）：单独从 document 再取一次，保持 useMemo 返回形状简单。
  const internalCount = useMemo(() => {
    if (!doc) return 0;
    const groupOf = new Map(doc.objectTypes.map((t) => [t.id, t.group] as const));
    return doc.relations.filter((r) => groupOf.get(r.sourceTypeId) === groupOf.get(r.targetTypeId)).length;
  }, [doc]);

  if (!doc) {
    return (
      <div className="semovix-card py-10 text-center text-[13px] text-slate-400">
        正在读取当前视图…
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="semovix-card border-dashed py-12 text-center">
        <p className="text-[13px] text-slate-400">当前视图暂无对象类型（新建本体可先到「对象类型」页添加类型，区域图随后出现）。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="region-map">
      {/* 区域卡片：点击进入对象类型页并应用分组过滤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {regions.map((r) => (
          <button
            key={r.name}
            onClick={() => onEnterRegion(r.name)}
            data-testid="region-card"
            className="semovix-card p-4 text-left hover:border-blue-300 transition-colors group"
            title={`进入对象类型 · 分组「${r.name}」`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="semovix-section-title flex items-center gap-1.5 min-w-0">
                <MapIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-500 shrink-0"/>
                <span className="truncate">{r.name}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400 shrink-0"/>
            </div>
            <p className="text-[12px] text-slate-500 mt-1.5">
              <span className="font-mono font-bold text-slate-700">{r.types.length}</span> 个类型
              <span className="text-slate-400">
                （{r.localCount} 本地{r.systemCount > 0 && ` + ${r.systemCount} 系统`}{r.externalCount > 0 && ` + ${r.externalCount} 外部引用`}）
              </span>
            </p>
            {/* 类型名称摘要：最多 6 个，其余计数 */}
            <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
              {r.types.slice(0, 6).map((t) => (
                <span key={t.id} className="inline-flex items-center gap-0.5 mr-1.5">
                  {t.origin === 'EXTERNAL' && <ExternalLink className="h-3 w-3 text-amber-500"/>}
                  {t.nameCn}
                </span>
              ))}
              {r.types.length > 6 && <span className="text-slate-400">等 {r.types.length} 个</span>}
            </p>
          </button>
        ))}
      </div>

      {/* 区域级关系摘要：点击进入关系与约束页（完整节点级图在那里） */}
      <div className="semovix-card px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 text-slate-400"/>区域级关系摘要
          </p>
          <button onClick={onEnterRelations} className="semovix-btn-text text-[12px]" title="进入关系与约束页查看完整节点级结构视图">
            查看关系与约束<ArrowRight className="h-3 w-3"/>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2" data-testid="region-links">
          {links.length === 0 && internalCount === 0 && (
            <p className="text-[12px] text-slate-400">当前视图没有关系定义。</p>
          )}
          {links.map((l) => (
            <button
              key={l.key}
              onClick={onEnterRelations}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
              title={`查看 ${l.from} → ${l.to} 的关系定义`}
            >
              {l.from}<ArrowRight className="h-3 w-3 text-slate-400"/>{l.to}
              <span className="font-mono font-bold text-slate-400">{l.count}</span>
            </button>
          ))}
          {internalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-500">
              区域内部关系 <span className="font-mono font-bold">{internalCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
