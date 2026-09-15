/**
 * Semovix 产品外壳（Batch 3.5 恢复）。
 *
 * - 顶部一级导航：工作台 / 任务中心 / 业务语义 / 知识网络 / 管理中心。
 *   本体域（列表 + 详情）不再作为独立子应用渲染，而是在此外壳内呈现，
 *   当前一级菜单高亮“业务语义”。
 * - 左侧只显示当前一级菜单的子菜单：业务语义组仅“业务本体”（高亮）；
 *   不新增 DRKN / DKN 产品菜单，也不再渲染 DRKN ON-DEV CENTER、
 *   AI · Insight 与字母 D Logo。
 * - 右上角常驻“演示数据 · Mock API”徽标与演示身份切换（maintainer/viewer），
 *   身份切换在这里统一使 ontology-v1 缓存失效。
 * - 本体的八项能力（总览/对象类型/关系/行动/实现绑定/流程/校验/发布）
 *   只是模型详情页内的 Tabs，不进入一级导航。
 */
import {type ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {CircleDot, User} from 'lucide-react';
import {ONTOLOGY_LIST_PATH} from '../api/ontology-v1/routeContext';
import {useUiStore} from '../store/uiStore';
import {DEMO_ACTORS, useDemoIdentity} from './identity';
import {useInvalidateOnActorChange} from './queries';

export type SemovixTopNav = 'desktop' | 'tasks' | 'semantics' | 'knowledge' | 'admin';

interface TopItem {
  id: SemovixTopNav;
  label: string;
  /** 该一级菜单的子菜单（左侧栏内容）；无子菜单的模块不进入本体演示范围。 */
  sub?: Array<{id: string; label: string}>;
}

const TOP_NAV: TopItem[] = [
  {id: 'desktop', label: '工作台'},
  {id: 'tasks', label: '任务中心'},
  {id: 'semantics', label: '业务语义', sub: [{id: 'ontology_models', label: '业务本体'}]},
  {id: 'knowledge', label: '知识网络', sub: [
    {id: 'knowledge_network', label: '网络总览'},
    {id: 'knowledge_network_assets', label: '网络资产'},
  ]},
  {id: 'admin', label: '管理中心'},
];

export function SemovixShell({top, activeSub, children}: {
  top: SemovixTopNav;
  /** 左侧子菜单中高亮的项（本体域固定 ontology_models）。 */
  activeSub?: string;
  children: ReactNode;
}) {
  useInvalidateOnActorChange();
  const navigate = useNavigate();
  const navigateStore = useUiStore((s) => s.navigate);

  const current = TOP_NAV.find((t) => t.id === top) ?? TOP_NAV[0];

  /** 一级菜单 / 子菜单点击：本体域走规范路径，其余走遗留 store 视图。 */
  const goTop = (item: TopItem) => {
    if (item.id === 'semantics') {
      navigate(ONTOLOGY_LIST_PATH);
      return;
    }
    if (item.sub && item.sub.length > 0) {
      navigateStore(item.sub[0].id);
      return;
    }
    navigateStore(item.id);
  };
  const goSub = (id: string) => {
    if (top === 'semantics') {
      navigate(ONTOLOGY_LIST_PATH);
      return;
    }
    navigateStore(id);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* 一级导航条 */}
      <header className="bg-white border-b border-slate-200/70 h-14 shrink-0 flex items-center justify-between px-6 gap-6 sticky top-0 z-40">
        <div className="flex items-center gap-6 min-w-0">
          {/* 产品标识：Semovix（替代 DRKN ON-DEV CENTER / D Logo / AI · Insight） */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>
              </svg>
            </div>
            <div className="leading-none">
              <span className="text-[15px] font-bold text-slate-800 tracking-tight" style={{fontFamily: "'Inter', sans-serif"}}>Semovix</span>
              <p className="text-[9.5px] text-slate-400 font-semibold mt-1 tracking-wider">企业语义运营平台</p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 shrink-0"/>

          <nav className="flex items-center gap-1 min-w-0 overflow-x-auto">
            {TOP_NAV.map((item) => {
              const active = item.id === top;
              return (
                <button
                  key={item.id}
                  onClick={() => goTop(item)}
                  className={`px-3.5 py-1.5 text-[13.5px] font-semibold rounded-lg whitespace-nowrap transition-colors ${
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
          <nav className="px-3 space-y-1">
            {(current.sub ?? []).map((sub) => {
              const active = sub.id === activeSub;
              return (
                <button
                  key={sub.id}
                  onClick={() => goSub(sub.id)}
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
                该模块在本演示范围外（演示聚焦业务语义 → 业务本体）。
              </p>
            )}
          </nav>
          <div className="mt-auto px-5 py-4 border-t border-slate-100">
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              演示环境 · 契约 Mock 服务<br/>meta.dataMode=MOCK
            </p>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin" data-testid="semovix-main">
          {children}
        </main>
      </div>
    </div>
  );
}

/** 演示数据标识（Mock 服务，非生产连接）。 */
export function MockBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
      title="数据来自 ontology-delivery 契约 Mock 服务（meta.dataMode=MOCK），未连接任何生产服务"
    >
      <CircleDot className="h-3 w-3"/>
      演示数据 · Mock API
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
