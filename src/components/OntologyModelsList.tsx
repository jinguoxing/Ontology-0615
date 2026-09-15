/**
 * 业务本体列表（Batch 2 重写）。
 *
 * 数据只来自 GET /models（契约 Mock 服务）。区分系统模型（origin=SYSTEM，
 * 数据治理域，不可新建）与业务本体（origin=TENANT，经 POST /models 创建，
 * profile 固定 BUSINESS）。入口路径：业务语义 → 业务本体。
 *
 * 真实写路径：
 * - 新建本体：POST /models → 服务端返回初始 OPEN 草稿 → 直接进入该草稿。
 * - 创建变更：POST /models/:id/changesets（基于当前正式版本）。
 * - 继续草稿：读取 GET /models/:id/changesets/:cid 获取最新修订号后跳转。
 * 没有筛选器/统计卡的伪造；loading、error、empty、无权限（viewer）均有明确状态。
 */
import {useState, type ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  FileClock,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import {ontologyLocation} from '../api/ontology-v1/routeContext';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {ontologyV1} from '../api/ontology-v1/client';
import type {ModelSummary} from '../api/ontology-v1/types.generated';
import {
  apiErrorMessage,
  useActorScope,
  useCreateChangeSet,
  useCreateModel,
  useInvalidateOnActorChange,
  useModels,
  useSession,
} from '../ontology/queries';
import {DEMO_ACTORS, useDemoIdentity} from '../ontology/identity';

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;

/** 由当前正式版本推导下一个目标版本号（仅作为表单默认值，服务端最终校验）。 */
function nextTargetVersion(current: string | null | undefined): string {
  if (!current) return 'v1.0.0';
  const m = current.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return `${current}-next`;
  return `v${m[1]}.${Number(m[2]) + 1}.${m[3]}`;
}

export default function OntologyModelsList() {
  useInvalidateOnActorChange();
  const actorScope = useActorScope();
  const sessionQuery = useSession(actorScope);
  const modelsQuery = useModels(actorScope);
  const createModel = useCreateModel(actorScope);
  const navigate = useNavigate();
  const actor = useDemoIdentity((s) => s.actor);
  const setActor = useDemoIdentity((s) => s.setActor);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({id: '', name: '', ownerRef: ''});
  const [formError, setFormError] = useState<string | null>(null);

  const capabilities = sessionQuery.data?.capabilities ?? [];
  const canEdit = capabilities.includes('ontology.edit');

  const models = modelsQuery.data?.items ?? [];
  const systemModels = models.filter((m) => m.origin === 'SYSTEM');
  const tenantModels = models.filter((m) => m.origin === 'TENANT');

  const submitCreate = () => {
    setFormError(null);
    if (!ID_PATTERN.test(form.id)) {
      setFormError('模型 ID 需匹配 ^[A-Za-z][A-Za-z0-9_.:-]*$（字母开头）');
      return;
    }
    if (!form.name.trim()) {
      setFormError('请填写本体名称');
      return;
    }
    if (!form.ownerRef.trim()) {
      setFormError('请填写责任方（ownerRef）');
      return;
    }
    createModel.mutate(
      {id: form.id, name: form.name.trim(), profile: 'BUSINESS', ownerRef: form.ownerRef.trim()},
      {
        onSuccess: (result) => {
          // 服务端已创建初始 OPEN 草稿；直接进入该草稿的对象类型页。
          navigate(ontologyLocation({
            modelId: result.data.model.id,
            tab: 'object-types',
            view: {changeSetId: result.data.changeSet.id, revision: result.data.changeSet.revision},
          }));
        },
        onError: (e) => setFormError(apiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 顶栏 */}
      <div className="bg-white border-b border-slate-200/70">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">业务语义</span>
            <span className="text-slate-300">/</span>
            <span>业务本体</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
              title="数据来自 ontology-delivery 契约 Mock 服务（meta.dataMode=MOCK），未连接任何生产服务"
            >
              <CircleDot className="h-3 w-3"/>
              演示数据 · Mock API
            </span>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              演示身份
              <select
                value={actor}
                onChange={(e) => setActor(e.target.value as 'demo-maintainer' | 'demo-viewer')}
                className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-500"
              >
                {DEMO_ACTORS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600"/>
              业务本体
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              系统模型（数据治理域）与各业务域本体的当前版本与草稿，全部读取自 GET /models。
            </p>
          </div>
          <button
            onClick={() => { setCreateOpen(true); setFormError(null); }}
            disabled={!canEdit}
            title={canEdit ? 'POST /models（profile=BUSINESS）' : '当前演示身份仅 ontology.read，无创建权限'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg ${
              canEdit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="h-3.5 w-3.5"/>
            新建本体{!canEdit && '（需 ontology.edit）'}
          </button>
        </div>

        {/* 加载 / 错误 */}
        {modelsQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin"/>
            正在读取模型列表（GET /models）…
          </div>
        )}
        {modelsQuery.isError && (
          <div className="bg-white border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0"/>
            <div className="space-y-2">
              <p className="text-sm font-bold text-red-700">模型列表加载失败</p>
              <p className="text-xs text-slate-600 break-all">{apiErrorMessage(modelsQuery.error)}</p>
              <button
                onClick={() => void modelsQuery.refetch()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-3.5 w-3.5"/>重试
              </button>
            </div>
          </div>
        )}

        {modelsQuery.isSuccess && (
          <>
            <ModelSection
              title="系统模型"
              description="数据治理域内置模型，由平台团队维护，不可新建或删除。"
              models={systemModels}
              canEdit={canEdit}
              emptyHint="Mock 服务未返回系统模型。"
            />
            <ModelSection
              title="业务本体"
              description="业务域自建本体（profile=BUSINESS），从“新建本体”创建并获得初始草稿。"
              models={tenantModels}
              canEdit={canEdit}
              emptyHint="暂无业务本体。点击右上角“新建本体”创建第一个（POST /models，真实写入 Mock 服务）。"
            />
          </>
        )}

        {/* 新建本体弹层 */}
        {createOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">新建业务本体</h2>
                <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4"/>
                </button>
              </div>
              <p className="text-[11.5px] text-slate-500">
                POST /models（profile 固定 BUSINESS）。服务端会创建初始 OPEN 草稿，成功后直接进入该草稿。
              </p>
              <div className="space-y-3">
                <Field label="模型 ID" hint="字母开头，可含数字与 _ . : -">
                  <input
                    value={form.id}
                    onChange={(e) => setForm((f) => ({...f, id: e.target.value}))}
                    placeholder="例如 marketing-ontology"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </Field>
                <Field label="本体名称">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
                    placeholder="例如 营销业务本体"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </Field>
                <Field label="责任方 ownerRef">
                  <input
                    value={form.ownerRef}
                    onChange={(e) => setForm((f) => ({...f, ownerRef: e.target.value}))}
                    placeholder="例如 marketing-team"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </Field>
              </div>
              {formError && (
                <p className="text-[11.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  取消
                </button>
                <button
                  onClick={submitCreate}
                  disabled={createModel.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {createModel.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}
                  创建并进入草稿
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[10.5px] text-slate-400 font-mono">{hint}</span>}
    </label>
  );
}

function ModelSection({title, description, models, canEdit, emptyHint}: {
  title: string;
  description: string;
  models: ModelSummary[];
  canEdit: boolean;
  emptyHint: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-bold text-slate-700">{title}</h2>
        <span className="text-[11.5px] text-slate-400">{description}</span>
        <span className="ml-auto text-[11px] font-mono text-slate-400">{models.length} 个模型</span>
      </div>
      {models.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl px-6 py-10 text-center text-[13px] text-slate-500">
          {emptyHint}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* 项目未安装 @types/react（React 以 allowJs 推断类型），key 不能直接传给
              自定义组件，因此放在 display:contents 的原生元素上，网格布局不受影响。 */}
          {models.map((m) => (
            <div key={m.id} className="contents">
              <ModelCard model={m} canEdit={canEdit}/>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ModelCard({model, canEdit}: {model: ModelSummary; canEdit: boolean}) {
  const actorScope = useActorScope();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createChangeSet = useCreateChangeSet(actorScope, model.id);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [changeFormOpen, setChangeFormOpen] = useState(false);
  const [changeForm, setChangeForm] = useState({name: '', reason: ''});
  const [changeError, setChangeError] = useState<string | null>(null);

  const goVersion = () => {
    if (!model.currentVersionId) return;
    navigate(ontologyLocation({modelId: model.id, tab: 'overview', view: {versionId: model.currentVersionId}}));
  };

  const goDraft = async (tab: 'overview' | 'object-types' = 'object-types') => {
    if (!model.activeChangeSetId) return;
    setDraftBusy(true);
    setDraftError(null);
    try {
      const cs = await queryClient.fetchQuery({
        queryKey: ontologyKeys.changeSet({...actorScope, modelId: model.id}, model.activeChangeSetId),
        queryFn: () => ontologyV1.getChangeSet(model.id, model.activeChangeSetId!),
        staleTime: 15_000,
      });
      navigate(ontologyLocation({
        modelId: model.id,
        tab,
        view: {changeSetId: cs.data.id, revision: cs.data.revision},
      }));
    } catch (e) {
      setDraftError(apiErrorMessage(e));
    } finally {
      setDraftBusy(false);
    }
  };

  const submitChangeSet = () => {
    setChangeError(null);
    if (!changeForm.name.trim()) {
      setChangeError('请填写变更名称');
      return;
    }
    createChangeSet.mutate(
      {
        name: changeForm.name.trim(),
        reason: changeForm.reason.trim() || `${changeForm.name.trim()}（Batch 2 列表页创建）`,
        baseVersionId: model.currentVersionId,
        targetVersionId: nextTargetVersion(model.currentVersionId),
      },
      {
        onSuccess: (cs) => {
          navigate(ontologyLocation({
            modelId: model.id,
            tab: 'object-types',
            view: {changeSetId: cs.data.id, revision: cs.data.revision},
          }));
        },
        onError: (e) => setChangeError(apiErrorMessage(e)),
      },
    );
  };

  const hasDraft = Boolean(model.activeChangeSetId);
  const hasVersion = Boolean(model.currentVersionId);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-bold text-slate-800 truncate">{model.name}</h3>
            <span className="text-[10.5px] font-mono text-slate-400">{model.id}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            责任方 <span className="font-mono">{model.ownerRef}</span>
            {model.currentVersionHash && (
              <span className="ml-2 text-slate-400 font-mono" title={model.currentVersionHash}>
                hash {model.currentVersionHash.slice(0, 8)}…
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            model.profile === 'BUSINESS'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {model.profile === 'BUSINESS' ? '业务本体' : '数据治理模型'}
          </span>
          {hasVersion ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3"/>{model.currentVersionId}
            </span>
          ) : (
            <span className="text-[10.5px] text-slate-400">尚未发布版本</span>
          )}
          {hasDraft && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-blue-700">
              <FileClock className="h-3 w-3"/>草稿 {model.activeChangeSetId}
            </span>
          )}
        </div>
      </div>

      {draftError && <p className="text-[11px] text-red-600">{draftError}</p>}

      <div className="flex items-center gap-2 flex-wrap pt-1">
        <button
          onClick={goVersion}
          disabled={!hasVersion}
          title={hasVersion ? `查看 ${model.currentVersionId}` : '该模型尚无正式版本'}
          className={`px-3 py-1.5 text-[11.5px] font-bold rounded-lg ${
            hasVersion
              ? 'bg-slate-800 text-white hover:bg-slate-900'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          查看当前版本
        </button>
        {hasDraft ? (
          <button
            onClick={() => void goDraft()}
            disabled={draftBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-60"
          >
            {draftBusy && <Loader2 className="h-3 w-3 animate-spin"/>}
            继续草稿
          </button>
        ) : canEdit ? (
          <button
            onClick={() => { setChangeFormOpen((v) => !v); setChangeError(null); }}
            disabled={!hasVersion}
            title={hasVersion ? 'POST /models/:id/changesets' : '新模型请直接在初始草稿上编辑'}
            className={`px-3 py-1.5 text-[11.5px] font-bold rounded-lg ${
              hasVersion
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            创建变更
          </button>
        ) : (
          <span className="text-[10.5px] text-slate-400" title="当前演示身份仅 ontology.read">
            创建变更（需 ontology.edit）
          </span>
        )}
      </div>

      {changeFormOpen && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <input
            value={changeForm.name}
            onChange={(e) => setChangeForm((f) => ({...f, name: e.target.value}))}
            placeholder="变更名称，例如：新增供应商对象"
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            value={changeForm.reason}
            onChange={(e) => setChangeForm((f) => ({...f, reason: e.target.value}))}
            placeholder="变更原因（可空，将使用默认说明）"
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <p className="text-[10.5px] text-slate-400">
            基于 {model.currentVersionId ?? '（无正式版本）'} → 目标 {nextTargetVersion(model.currentVersionId)}
          </p>
          {changeError && <p className="text-[11px] text-red-600">{changeError}</p>}
          <div className="flex gap-2">
            <button
              onClick={submitChangeSet}
              disabled={createChangeSet.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {createChangeSet.isPending && <Loader2 className="h-3 w-3 animate-spin"/>}
              创建并进入草稿
            </button>
            <button
              onClick={() => setChangeFormOpen(false)}
              className="px-3 py-1.5 text-[11.5px] font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              收起
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
