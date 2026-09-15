/**
 * Semovix 产品外壳（Batch 3.5 建立，Batch 3.6 对齐 Semovix IA 与品牌）。
 *
 * - 顶部一级导航（严格七项）：Xino 智能伙伴 / 任务中心 / 智能体中心 /
 *   业务语义 / 数据服务超市 / 数据治理 / 管理中心；本体演示期间高亮
 *   “业务语义”。“知识网络”不是一级菜单，它是业务语义的内部能力。
 * - 左侧子菜单只显示当前一级菜单的能力：业务语义组为 概览 / 业务域 /
 *   业务本体 / 业务术语 / 指标 / 知识网络（本体演示期间高亮“业务本体”）。
 *   其中 业务本体（/business-semantics/ontologies）与 知识网络
 *   （/business-semantics/knowledge-network）在仓库中已实现，其余项与
 *   未实现的一级模块走规划中的真实路由并呈现“当前演示范围外”，
 *   不伪造页面或数据。
 * - 品牌：官方 Semovix Logo（public/brand/semovix-logo.svg，原图引用，
 *   不重绘、不变形）；产品定位“企业 AI 原生语义智能平台”。
 * - 右上角保留唯一的低权重“演示数据”标识与演示身份切换
 *   （maintainer/viewer），身份切换在这里统一使 ontology-v1 缓存失效。
 * - 本体的八项能力（总览/对象类型/关系/行动/实现绑定/流程/校验/发布）
 *   只是模型详情页内的 Tabs，不进入一级导航或左侧产品菜单。
 */
import {type ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {User} from 'lucide-react';
import {DEMO_ACTORS, useDemoIdentity} from './identity';
import {useInvalidateOnActorChange} from './queries';

export type SemovixTopNav =
  | 'xino'
  | 'tasks'
  | 'agents'
  | 'semantics'
  | 'data-services'
  | 'data-governance'
  | 'admin';

export interface SemovixSubItem {
  id: string;
  label: string;
  /** 规划中的真实路由（点击左侧子菜单即导航到该路径）。 */
  path: string;
}

export interface SemovixNavItem {
  id: SemovixTopNav;
  label: string;
  /** 规划中的真实路由。 */
  path: string;
  /** 该一级菜单的子菜单（左侧栏内容）。 */
  sub?: SemovixSubItem[];
}

/** Semovix 一级导航（顺序与命名不可调整；路由为规划中的真实路径）。 */
export const SEMOVIX_TOP_NAV: SemovixNavItem[] = [
  {id: 'xino', label: 'Xino 智能伙伴', path: '/xino'},
  {id: 'tasks', label: '任务中心', path: '/tasks'},
  {id: 'agents', label: '智能体中心', path: '/agents'},
  {
    id: 'semantics',
    label: '业务语义',
    path: '/business-semantics/overview',
    sub: [
      {id: 'semantics_overview', label: '概览', path: '/business-semantics/overview'},
      {id: 'semantics_domains', label: '业务域', path: '/business-semantics/domains'},
      {id: 'ontology_models', label: '业务本体', path: '/business-semantics/ontologies'},
      {id: 'semantics_terms', label: '业务术语', path: '/business-semantics/terms'},
      {id: 'semantics_metrics', label: '指标', path: '/business-semantics/metrics'},
      {id: 'knowledge_network', label: '知识网络', path: '/business-semantics/knowledge-network'},
    ],
  },
  {id: 'data-services', label: '数据服务超市', path: '/data-services'},
  {id: 'data-governance', label: '数据治理', path: '/data-governance'},
  {id: 'admin', label: '管理中心', path: '/admin'},
];

/** 一级菜单 id → 导航项（App 路由与外壳共用同一份 IA 定义）。 */
export const SEMOVIX_NAV_BY_ID: Record<SemovixTopNav, SemovixNavItem> = Object.fromEntries(
  SEMOVIX_TOP_NAV.map((item) => [item.id, item]),
) as Record<SemovixTopNav, SemovixNavItem>;

/** 业务语义左侧子菜单 id → 子菜单项。 */
export const SEMANTICS_SUB_BY_ID: Record<string, SemovixSubItem> = Object.fromEntries(
  (SEMOVIX_NAV_BY_ID.semantics.sub ?? []).map((s) => [s.id, s]),
);

/**
 * 外壳原生渲染的规划路由：未实现的一级模块 + 业务语义下不由遗留 store
 * 驱动的子能力路径（知识网络页仍由遗留 store 视图驱动，不在此列）。
 * useRouteSync 对这些路径保持惰性——既不把路径折算成遗留 store 视图，
 * 也不把 store 视图推过去覆盖，否则深链接会被重定向到知识网络。
 */
export const SEMOVIX_SHELL_OWNED_PATHS: ReadonlySet<string> = new Set([
  ...SEMOVIX_TOP_NAV.filter((item) => !item.sub).map((item) => item.path),
  ...(SEMOVIX_NAV_BY_ID.semantics.sub ?? [])
    .filter((s) => s.id !== 'knowledge_network')
    .map((s) => s.path),
]);

export function SemovixShell({top, activeSub, children}: {
  top: SemovixTopNav;
  /** 左侧子菜单中高亮的项（本体域固定 ontology_models）。 */
  activeSub?: string;
  children: ReactNode;
}) {
  useInvalidateOnActorChange();
  const navigate = useNavigate();

  const current = SEMOVIX_NAV_BY_ID[top];

  /**
   * 一级菜单点击：全部走规划中的真实路由。“业务语义”保持既有演示入口，
   * 直接进入业务本体列表（已实现的核心域），不切到任何遗留页面。
   */
  const goTop = (item: SemovixNavItem) => {
    navigate(item.id === 'semantics' ? '/business-semantics/ontologies' : item.path);
  };
  /** 子菜单点击：走该项的规范路径（已实现项与占位项同样处理）。 */
  const goSub = (sub: SemovixSubItem) => {
    navigate(sub.path);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* 一级导航条 */}
      <header className="bg-white border-b border-slate-200/70 h-14 shrink-0 flex items-center justify-between px-6 gap-6 sticky top-0 z-40">
        <div className="flex items-center gap-5 min-w-0">
          {/* 产品标识：官方 Semovix Logo（原图引用）+ 产品定位 */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/brand/semovix-logo.svg"
              alt="Semovix"
              className="h-7 w-auto"
              data-testid="semovix-logo"
            />
            <div className="h-5 w-px bg-slate-200"/>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider leading-tight">
              企业 AI 原生<br/>语义智能平台
            </p>
          </div>

          <div className="h-5 w-px bg-slate-200 shrink-0"/>

          <nav className="flex items-center gap-1 min-w-0 overflow-x-auto" data-testid="semovix-top-nav">
            {SEMOVIX_TOP_NAV.map((item) => {
              const active = item.id === top;
              return (
                <button
                  key={item.id}
                  onClick={() => goTop(item)}
                  className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <MockBadge/>
          <div className="h-5 w-px bg-slate-200"/>
          <IdentitySwitcher/>
          <div className="h-5 w-px bg-slate-200"/>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
              <User className="h-3.5 w-3.5"/>
            </div>
            <span className="hidden lg:block text-xs font-semibold text-slate-600">管理员</span>
          </div>
        </div>
      </header>

      {/* 左侧子菜单 + 主内容 */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 shrink-0 bg-white border-r border-slate-200/70 flex flex-col">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">{current.label}</p>
          </div>
          <nav className="px-3 space-y-1" data-testid="semovix-sub-nav">
            {(current.sub ?? []).map((sub) => {
              const active = sub.id === activeSub;
              return (
                <button
                  key={sub.id}
                  onClick={() => goSub(sub)}
                  className={`w-full px-3 py-2 rounded-lg flex items-center text-[13px] font-medium transition-colors ${
                    active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-2.5 ${active ? 'bg-blue-500' : 'bg-slate-300'}`}/>
                  {sub.label}
                </button>
              );
            })}
            {!current.sub && (
              <p className="px-3 py-2 text-[11.5px] text-slate-400 leading-relaxed">
                当前演示范围外（演示聚焦业务语义 → 业务本体）。
              </p>
            )}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin" data-testid="semovix-main">
          {children}
        </main>
      </div>
    </div>
  );
}

/** 全页唯一的演示数据标识（低权重；工程原值见「技术详情」抽屉）。 */
export function MockBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-500 border border-slate-200"
      title="当前使用演示实现，数据来自演示服务，未连接任何生产服务"
    >
      演示数据
    </span>
  );
}

/** 演示身份切换（demo-maintainer / demo-viewer）。 */
export function IdentitySwitcher() {
  const actor = useDemoIdentity((s) => s.actor);
  const setActor = useDemoIdentity((s) => s.setActor);
  return (
    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
      演示身份
      <select
        data-testid="identity-select"
        value={actor}
        onChange={(e) => setActor(e.target.value as typeof actor)}
        className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-500"
      >
        {DEMO_ACTORS.map((a) => (
          <option key={a.id} value={a.id}>{a.label}</option>
        ))}
      </select>
    </label>
  );
}
