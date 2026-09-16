/**
 * 诊断信息抽屉（Batch 3.5 建立 · Batch 4.5 第七节收口）。
 *
 * 主界面只保留产品语义（草稿/版本/目标版本等状态带）；工程标识集中在这里：
 * contentHash、ETag、当前页面的 API Path、会话 capabilities、Registry 原始值
 * （transport / liveEndpointVerified / demoMode / executable 等登记原值）。
 * 全部来自真实 HTTP 返回，不做美化或推断。
 *
 * Batch 4.5：
 * - 更名「技术详情」→「诊断信息」，入口移入页面头「更多」菜单，仅在
 *   开发构建显式开启 VITE_ENABLE_ONTOLOGY_DIAGNOSTICS=true 或会话具备
 *   ontology.diagnostics.read 能力时可见（由 OntologyLayout 裁决）。
 * - 支持复制：页面链接、contentHash、ETag。
 * - Raw JSON 维持字段白名单（implementations 仅 id/versionId/kind/transport/
 *   liveEndpointVerified/demoMode；workflows 仅登记元数据；ioContracts 仅 id）。
 *   不显示 Token、Secret、连接地址与凭证。
 */
import {useState, type ReactNode} from 'react';
import {AlertTriangle, Check, Copy, Loader2} from 'lucide-react';
import type {OntologyTab} from '../api/ontology-v1/routeContext';
import {useActorScope, useRegistry} from './queries';
import {useModelContext, type ModelContextValue} from './ModelContext';
import {Drawer} from './draftWrite';

const TAB_API_PATHS: Record<OntologyTab, string[]> = {
  'overview': [
    'GET /api/v1/ontology/models/{modelId}',
    'GET /api/v1/ontology/models/{modelId}/view',
    'GET /api/v1/ontology/models/{modelId}/graph',
    'GET /api/v1/ontology/models/{modelId}/versions',
    'GET /api/v1/ontology/models/{modelId}/audit-events',
  ],
  'object-types': ['GET /api/v1/ontology/models/{modelId}/view'],
  'relations': [
    'GET /api/v1/ontology/models/{modelId}/relations',
    'GET /api/v1/ontology/models/{modelId}/constraints',
  ],
  'actions': [
    'GET /api/v1/ontology/models/{modelId}/actions',
    'GET /api/v1/ontology/action-fixtures',
    'POST /api/v1/ontology/models/{modelId}/action-tests',
  ],
  'implementations': [
    'GET /api/v1/ontology/models/{modelId}/implementation-bindings',
    'GET /api/v1/ontology/registry',
  ],
  'workflows': [
    'GET /api/v1/ontology/models/{modelId}/workflow-refs',
    'GET /api/v1/ontology/registry',
  ],
  'validation': [
    'GET /api/v1/ontology/changesets/{changeSetId}?revision=',
    'GET /api/v1/ontology/changesets/{changeSetId}/diff?revision=',
    'GET /api/v1/ontology/registry',
    'POST /api/v1/ontology/models/{modelId}/validation-runs（If-Match + Idempotency-Key）',
    'POST /api/v1/ontology/models/{modelId}/impact-analyses（If-Match + Idempotency-Key）',
    'GET /api/v1/ontology/models/{modelId}/jobs/{jobId}',
  ],
  'release': [
    'GET /api/v1/ontology/changesets/{changeSetId}?revision=',
    'GET /api/v1/ontology/changesets/{changeSetId}/diff?revision=',
    'GET /api/v1/ontology/models/{modelId}/versions',
    'GET /api/v1/ontology/models/{modelId}/versions/{versionId}',
    'GET /api/v1/ontology/models/{modelId}/audit-events',
    'POST /api/v1/ontology/models/{modelId}/publications（If-Match + Idempotency-Key）',
  ],
};

const WRITE_PATH = 'POST /api/v1/ontology/changesets/{changeSetId}/operations（If-Match + Idempotency-Key）';

export function TechnicalDetailsDrawer({open, onClose}: {open: boolean; onClose: () => void}) {
  const ctx = useModelContext();
  if (!open) return null;
  return <TechnicalDetailsContent ctx={ctx} onClose={onClose}/>;
}

function TechnicalDetailsContent({ctx, onClose}: {ctx: ModelContextValue; onClose: () => void}) {
  const scope = useActorScope();
  const registryQuery = useRegistry(scope);
  const registry = registryQuery.data;

  const view = ctx.view;
  const viewRef = 'versionId' in view
    ? `versionId=${view.versionId}`
    : `changeSetId=${view.changeSetId} · revision=${view.revision}`;

  const transports = registry
    ? [...new Set(registry.implementations.map((i) => i.transport))]
    : [];

  return (
    <Drawer
      title="诊断信息"
      subtitle="当前页面与视图的工程标识（原始值，来自 HTTP 返回）。产品界面中的状态带只保留产品语义；本入口仅开发配置或诊断能力下可见。"
      onClose={onClose}
      width="max-w-[560px]"
    >
      <div className="space-y-5 text-[13px]" data-testid="diagnostics-drawer">
        {/* 视图引用 */}
        <Section title="视图引用（URL 为唯一事实来源）">
          <MonoRow label="modelId" value={ctx.modelId} copy/>
          <MonoRow label="view" value={viewRef}/>
          <MonoRow label="mode" value={ctx.resolvedView?.mode ?? '…'}/>
          <MonoRow label="readOnly" value={String(ctx.resolvedView?.readOnly ?? '…')}/>
          <MonoRow label="页面链接" value={typeof window === 'undefined' ? '—' : window.location.href} copy shrink/>
        </Section>

        {/* 内容标识 */}
        <Section title="内容标识">
          <MonoRow label="contentHash" value={ctx.resolvedView?.contentHash ?? '…'} full copy/>
          <MonoRow label="ETag (If-Match)" value={ctx.resolvedView?.etag ?? '…'} full copy/>
          <MonoRow label="currentVersionId" value={ctx.model?.currentVersionId ?? '（尚未发布）'}/>
        </Section>

        {/* API Path */}
        <Section title={`API Path（当前功能：${ctx.tab}）`}>
          {TAB_API_PATHS[ctx.tab].map((p) => (
            <p key={p} className="font-mono text-[12px] text-slate-600 break-all">{p}</p>
          ))}
          {ctx.isDraft && <p className="font-mono text-[12px] text-slate-500 break-all pt-1 border-t border-slate-100 mt-1">{WRITE_PATH}</p>}
        </Section>

        {/* 会话能力 */}
        <Section title="会话 capabilities（GET /session）">
          <div className="flex flex-wrap gap-1.5">
            {ctx.capabilities.length > 0
              ? ctx.capabilities.map((c) => (
                <span key={c} className="px-1.5 py-0.5 rounded border text-[12px] font-mono bg-slate-50 text-slate-600 border-slate-200">{c}</span>
              ))
              : <span className="text-slate-400">读取中…</span>}
          </div>
          <p className="text-[12px] text-slate-400 mt-1.5">actorId {ctx.actorId}</p>
        </Section>

        {/* Registry 原始值 */}
        <Section title="Registry 原始值（GET /registry）">
          {registryQuery.isLoading && (
            <p className="flex items-center gap-1.5 text-slate-400"><Loader2 className="h-3 w-3 animate-spin"/>读取 Registry…</p>
          )}
          {registryQuery.isError && (
            <p className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="h-3 w-3"/>{(registryQuery.error as Error).message}
            </p>
          )}
          {registry && (
            <div className="space-y-1.5">
              <MonoRow label="implementations" value={`${registry.implementations.length} 个登记实现`}/>
              <MonoRow label="transport" value={transports.join(' / ') || '—'}/>
              <MonoRow label="liveEndpointVerified" value={
                registry.implementations.every((i) => i.liveEndpointVerified === false)
                  ? '全部 false（生产端点尚未验证）'
                  : '部分 true'
              }/>
              <MonoRow label="workflows executable" value={
                registry.workflows.every((w) => w.executable === false)
                  ? `${registry.workflows.length} 个流程全部 false（未连接实际 Runtime）`
                  : '部分 true'
              }/>
              <details className="pt-1.5">
                <summary className="text-[12px] font-semibold text-slate-500 cursor-pointer">原始 JSON（字段白名单：implementations · workflows · ioContracts）</summary>
                <pre className="mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-mono overflow-x-auto max-h-72 overflow-y-auto">{JSON.stringify({
                  implementations: registry.implementations.map(({id, versionId, kind, transport, liveEndpointVerified, demoMode}) =>
                    ({id, versionId, kind, transport, liveEndpointVerified, demoMode})),
                  workflows: registry.workflows,
                  ioContracts: registry.ioContracts.map((c) => c.id),
                }, null, 2)}</pre>
              </details>
              <p className="text-[12px] text-slate-400 pt-1">白名单外的字段（Token、Secret、连接地址、凭证等）不在诊断信息中呈现。</p>
            </div>
          )}
        </Section>
      </div>
    </Drawer>
  );
}

function Section({title, children}: {title: string; children: ReactNode}) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
      <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

/** 复制按钮：点击后 1.5s 内显示已复制（剪贴板 API 不可用时静默降级）。 */
function CopyButton({value}: {value: string}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(done, () => {});
    } else {
      // 非安全上下文降级：选区复制，失败不提示（诊断场景可手动选中文本）。
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch {
        /* 忽略 */
      }
    }
  };
  return (
    <button
      onClick={copy}
      title="复制"
      className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500"/> : <Copy className="h-3 w-3"/>}
    </button>
  );
}

function MonoRow({label, value, full, copy, shrink}: {label: string; value: string; full?: boolean; copy?: boolean; shrink?: boolean}) {
  return (
    <div className={`flex items-start gap-3 ${full ? '' : 'justify-between'}`}>
      <span className="text-[12px] text-slate-400 font-semibold shrink-0">{label}</span>
      <span className={`font-mono text-[12px] text-slate-600 break-all ${full ? 'flex-1' : 'text-right'} ${shrink ? 'max-w-[380px]' : ''}`}>
        {value}
      </span>
      {copy && <CopyButton value={value}/>}
    </div>
  );
}
