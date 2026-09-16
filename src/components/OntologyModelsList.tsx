/**
 * 业务本体列表（Batch 2 重写；Batch 3.5 并入 Semovix 外壳；Batch 4.5 收口；
 * Batch 4.6 系统模型状态动作统一 + 创建表单产品语言）。
 *
 * 数据只来自 GET /models（契约 Mock 服务）。区分系统模型（origin=SYSTEM，
 * 数据治理域，不可新建，紧凑基础模型区域）与业务本体（origin=TENANT，
 * 紧凑表格，见 OntologyModelsTable）。入口路径：业务语义 → 业务本体。
 *
 * 真实写路径：
 * - 新建业务本体：POST /models → 服务端返回初始 OPEN 草稿 → 直接进入该草稿。
 * - 创建变更：POST /models/:id/changesets（基于当前正式版本）。
 * - 继续草稿 / 重新开始建模：读取 GET /models/:id/changesets/:cid 获取最新
 *   修订号后跳转；无版本无草稿时先创建初始 ChangeSet（ModelPrimaryAction）。
 * 产品层默认隐藏 modelId、changeSetId、ownerRef 原始值（Batch 4.5 第三节）；
 * 创建表单只呈现产品字段（本体名称 / 责任归属），系统标识收进默认关闭的
 * 「高级设置」（Batch 4.6 第五节）。不伪造更新时间、业务域与健康评分。
 * loading、error、empty、无权限（viewer）均有明确状态；顶部导航 / 演示标识 /
 * 身份切换由 SemovixShell 提供。
 */
import {useState, type ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileClock,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {ontologyLocation} from '../api/ontology-v1/routeContext';
import type {ModelSummary} from '../api/ontology-v1/types.generated';
import {
  apiErrorMessage,
  useActorScope,
  useCreateModel,
  useModels,
  useSession,
} from '../ontology/queries';
import {ownerDisplayName} from '../ontology/presentation';
import OntologyModelsTable from './OntologyModelsTable';
import ModelPrimaryAction, {CreateChangeSetForm} from './ModelPrimaryAction';

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;

/** 系统标识默认自动生成（接口要求稳定标识；用户可在高级设置中修改）。 */
function suggestModelId(): string {
  return `ontology-${Date.now().toString(36)}`;
}

export default function OntologyModelsList() {
  const actorScope = useActorScope();
  const sessionQuery = useSession(actorScope);
  const modelsQuery = useModels(actorScope);
  const createModel = useCreateModel(actorScope);
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [form, setForm] = useState({id: '', name: '', ownerRef: ''});
  const [formError, setFormError] = useState<string | null>(null);

  const capabilities = sessionQuery.data?.capabilities ?? [];
  const canEdit = capabilities.includes('ontology.edit');

  const models = modelsQuery.data?.items ?? [];
  const systemModels = models.filter((m) => m.origin === 'SYSTEM');
  const tenantModels = models.filter((m) => m.origin === 'TENANT');

  const openCreate = () => {
    setCreateOpen(true);
    setFormError(null);
    setAdvancedOpen(false);
    setForm({id: suggestModelId(), name: '', ownerRef: ''});
  };

  const submitCreate = () => {
    setFormError(null);
    if (!ID_PATTERN.test(form.id)) {
      setFormError('系统标识需以字母开头，可含数字与 _ . : -');
      return;
    }
    if (!form.name.trim()) {
      setFormError('请填写本体名称');
      return;
    }
    if (!form.ownerRef.trim()) {
      setFormError('请填写责任归属');
      return;
    }
    // 接口合同要求 ownerRef 为标识符格式（^[A-Za-z][A-Za-z0-9_.:-]*$）；
    // 提交前用产品语言校验，避免用户输入中文展示名后收到合同错误。
    if (!ID_PATTERN.test(form.ownerRef.trim())) {
      setFormError('责任归属标识需以字母开头，可含数字与 _ . : -（例如 crm-team）');
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
    <div className="min-h-full">
      <main className="px-8 py-6 space-y-6">
        {/* 页头（面包屑 / 演示标识 / 身份切换由 SemovixShell 渲染） */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="semovix-page-title flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600"/>
              业务本体
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              系统模型（数据治理域）与各业务域本体的当前版本与草稿。
            </p>
          </div>
          <button
            onClick={openCreate}
            disabled={!canEdit}
            title={canEdit ? '创建业务本体并获得初始草稿' : '当前演示身份为只读，无创建权限'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-bold rounded-lg ${
              canEdit
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="h-3.5 w-3.5"/>
            新建业务本体{!canEdit && '（需编辑权限）'}
          </button>
        </div>

        {/* 加载 / 错误 */}
        {modelsQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin"/>
            正在读取模型列表…
          </div>
        )}
        {modelsQuery.isError && (
          <div className="semovix-card border-red-200 p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0"/>
            <div className="space-y-2">
              <p className="text-sm font-bold text-red-700">模型列表加载失败</p>
              <p className="text-[13px] text-slate-600 break-all">{apiErrorMessage(modelsQuery.error)}</p>
              <button
                onClick={() => void modelsQuery.refetch()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-3.5 w-3.5"/>重试
              </button>
            </div>
          </div>
        )}

        {modelsQuery.isSuccess && (
          <>
            {/* 系统模型：紧凑基础模型区域（状态动作与业务本体统一） */}
            <SystemModelStrip models={systemModels} canEdit={canEdit}/>

            {/* 业务本体：紧凑表格（主操作按状态唯一） */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-3">
                <h2 className="semovix-section-title">业务本体</h2>
                <span className="text-[12px] text-slate-400">业务域自建本体，从“新建业务本体”创建并获得初始草稿。</span>
                <span className="ml-auto text-[12px] text-slate-400">{tenantModels.length} 个本体</span>
              </div>
              <OntologyModelsTable
                models={tenantModels}
                canEdit={canEdit}
                emptyHint="暂无业务本体。点击右上角“新建业务本体”创建第一个业务本体。"
              />
            </section>
          </>
        )}

        {/* 新建业务本体弹层 */}
        {createOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">新建业务本体</h2>
                <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4"/>
                </button>
              </div>
              <p className="text-[12px] text-slate-500">
                服务端会为新本体创建初始草稿，创建成功后直接进入该草稿。
              </p>
              <div className="space-y-3">
                <Field label="本体名称">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
                    placeholder="例如 营销业务本体"
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </Field>
                {/* 责任归属：接口合同要求标识符格式；中文展示名由展示层映射 */}
                <Field label="责任归属" hint="责任归属标识（字母开头，可含数字与 _ . : -，例如 crm-team）">
                  <input
                    value={form.ownerRef}
                    onChange={(e) => setForm((f) => ({...f, ownerRef: e.target.value}))}
                    placeholder="例如 crm-team"
                    className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </Field>
                {/* 高级设置：默认收起；系统标识（接口要求的稳定标识）默认自动生成 */}
                <div className="border-t border-slate-100 pt-2">
                  <button
                    onClick={() => setAdvancedOpen((v) => !v)}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-slate-700"
                    aria-expanded={advancedOpen}
                  >
                    {advancedOpen ? <ChevronDown className="h-3.5 w-3.5"/> : <ChevronRight className="h-3.5 w-3.5"/>}
                    高级设置
                  </button>
                  {advancedOpen && (
                    <div className="mt-2">
                      <Field label="系统标识" hint="用于接口与集成的稳定标识，默认自动生成">
                        <input
                          value={form.id}
                          onChange={(e) => setForm((f) => ({...f, id: e.target.value}))}
                          className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </div>
              {formError && (
                <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="semovix-btn-outline"
                >
                  取消
                </button>
                <button
                  onClick={submitCreate}
                  disabled={createModel.isPending}
                  className="semovix-btn-primary"
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

/**
 * 系统模型紧凑区域：数据治理域内置模型一行一条（名称 / 责任方 / 当前版本 /
 * 草稿状态 / 状态动作），不使用卡片栅格，也不显示原始 modelId / ownerRef。
 * 状态动作与业务本体统一（ModelPrimaryAction）：存在编辑草稿 → 继续草稿。
 */
function SystemModelStrip({models, canEdit}: {models: ModelSummary[]; canEdit: boolean}) {
  return (
    <section className="space-y-3" data-testid="system-model-strip">
      <div className="flex items-baseline gap-3">
        <h2 className="semovix-section-title">系统模型</h2>
        <span className="text-[12px] text-slate-400">数据治理域内置模型，由平台团队维护，不可新建或删除。</span>
      </div>
      {models.length === 0 ? (
        <div className="semovix-card border-dashed px-6 py-8 text-center text-[13px] text-slate-500">
          演示服务未返回系统模型。
        </div>
      ) : (
        <div className="semovix-card divide-y divide-slate-100">
          {models.map((m) => <SystemModelRow key={m.id} model={m} canEdit={canEdit}/>)}
        </div>
      )}
    </section>
  );
}

function SystemModelRow({model, canEdit}: {model: ModelSummary; canEdit: boolean}) {
  const navigate = useNavigate();
  const [changeFormOpen, setChangeFormOpen] = useState(false);

  const goVersion = () => {
    if (!model.currentVersionId) return;
    navigate(ontologyLocation({modelId: model.id, tab: 'overview', view: {versionId: model.currentVersionId}}));
  };

  return (
    <div className="px-4 py-3.5 space-y-2" data-testid="system-model-row">
      <div className="flex items-center gap-4 flex-wrap">
        <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0"/>
        <div className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-slate-800">{model.name}</span>
          <span className="block text-[12px] text-slate-400 mt-0.5">
            数据治理系统模型 · 系统内置 · 责任方 {ownerDisplayName(model.ownerRef)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {model.currentVersionId ? (
            <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5"/>当前版本 {model.currentVersionId}
            </span>
          ) : (
            <span className="text-[12px] text-slate-400">尚未发布版本</span>
          )}
          {model.activeChangeSetId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <FileClock className="h-3 w-3"/>存在编辑草稿
            </span>
          )}
        </div>
        <div className="inline-flex items-center gap-3 shrink-0">
          <ModelPrimaryAction
            model={model}
            canEdit={canEdit}
            onRequestCreateChange={() => { setChangeFormOpen((v) => !v); }}
          />
          {model.currentVersionId && (
            <button
              onClick={goVersion}
              className="semovix-btn-text shrink-0"
              title={`查看 ${model.currentVersionId}`}
            >
              查看正式版本
            </button>
          )}
        </div>
      </div>
      {changeFormOpen && <CreateChangeSetForm model={model} onDone={() => setChangeFormOpen(false)}/>}
    </div>
  );
}

function Field({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
  return (
    <label className="block space-y-1">
      <span className="text-[12px] font-bold text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-slate-400">{hint}</span>}
    </label>
  );
}
