/**
 * 业务本体表格（Batch 4.5 第三节）。
 *
 * 业务本体（origin=TENANT）从卡片栅格改为紧凑表格：
 * - 默认隐藏 modelId、changeSetId、ownerRef 原始值（责任方显示展示名称，
 *   见 presentation.ts；完整原始值在模型内页的诊断信息中）。
 * - 主操作按模型状态唯一：有草稿 → 继续草稿；有正式版本无草稿 → 创建变更；
 *   尚未发布 → 继续建模。次操作（查看版本）为文本按钮。
 * - 不伪造更新时间、业务域与健康评分（契约未提供这些字段）。
 * - 写路径不变：继续草稿读取 GET /changesets/:cid 最新修订后跳转；
 *   创建变更 POST /models/:id/changesets（基于当前正式版本）。
 */
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {CheckCircle2, FileClock, Hammer, Loader2, Plus} from 'lucide-react';
import {ontologyLocation} from '../api/ontology-v1/routeContext';
import {ontologyKeys} from '../api/ontology-v1/queryKeys';
import {ontologyV1} from '../api/ontology-v1/client';
import type {ModelSummary} from '../api/ontology-v1/types.generated';
import {
  apiErrorMessage,
  useActorScope,
  useCreateChangeSet,
} from '../ontology/queries';
import {ownerDisplayName} from '../ontology/presentation';

/** 由当前正式版本推导下一个目标版本号（仅作为表单默认值，服务端最终校验）。 */
export function nextTargetVersion(current: string | null | undefined): string {
  if (!current) return 'v1.0.0';
  const m = current.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return `${current}-next`;
  return `v${m[1]}.${Number(m[2]) + 1}.${m[3]}`;
}

export default function OntologyModelsTable({models, canEdit, emptyHint}: {
  models: ModelSummary[];
  canEdit: boolean;
  emptyHint: string;
}) {
  if (models.length === 0) {
    return (
      <div className="semovix-card border-dashed px-6 py-10 text-center text-[13px] text-slate-500">
        {emptyHint}
      </div>
    );
  }
  return (
    <div className="semovix-card overflow-hidden" data-testid="ontology-models-table">
      <table className="semovix-table">
        <thead>
          <tr>
            <th>业务本体</th>
            <th>责任方</th>
            <th>当前版本</th>
            <th>草稿</th>
            <th className="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => <ModelRow key={m.id} model={m} canEdit={canEdit}/>)}
        </tbody>
      </table>
    </div>
  );
}

function ModelRow({model, canEdit}: {model: ModelSummary; canEdit: boolean}) {
  const actorScope = useActorScope();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createChangeSet = useCreateChangeSet(actorScope, model.id);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [changeFormOpen, setChangeFormOpen] = useState(false);
  const [changeForm, setChangeForm] = useState({name: '', reason: ''});
  const [changeError, setChangeError] = useState<string | null>(null);

  const hasDraft = Boolean(model.activeChangeSetId);
  const hasVersion = Boolean(model.currentVersionId);

  const goDraft = async () => {
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
        tab: 'object-types',
        view: {changeSetId: cs.data.id, revision: cs.data.revision},
      }));
    } catch (e) {
      setDraftError(apiErrorMessage(e));
    } finally {
      setDraftBusy(false);
    }
  };

  const goVersion = () => {
    if (!model.currentVersionId) return;
    navigate(ontologyLocation({modelId: model.id, tab: 'overview', view: {versionId: model.currentVersionId}}));
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
        reason: changeForm.reason.trim() || `${changeForm.name.trim()}（Batch 4.5 列表页创建）`,
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

  return (
    <>
      <tr data-testid="ontology-model-row" className="align-middle">
        <td>
          <span className="block font-bold text-slate-800">{model.name}</span>
          <span className="block text-[12px] text-slate-400 mt-0.5">业务本体 · 租户创建</span>
        </td>
        <td className="text-slate-600">{ownerDisplayName(model.ownerRef)}</td>
        <td>
          {hasVersion ? (
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5"/>{model.currentVersionId}
            </span>
          ) : (
            <span className="text-slate-400">尚未发布</span>
          )}
        </td>
        <td>
          {hasDraft ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <FileClock className="h-3 w-3"/>编辑草稿中
            </span>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
        <td className="text-right">
          <div className="inline-flex items-center gap-3 whitespace-nowrap">
            {/* 次操作：文本按钮 */}
            <button onClick={goVersion} disabled={!hasVersion} className="semovix-btn-text disabled:text-slate-300" title={hasVersion ? `查看 ${model.currentVersionId}` : '该本体尚无正式版本'}>
              查看版本
            </button>
            {/* 主操作：按状态唯一（继续草稿 / 创建变更 / 继续建模） */}
            {hasDraft ? (
              <button onClick={() => void goDraft()} disabled={draftBusy} className="semovix-btn-primary" title="读取草稿最新修订后继续编辑">
                {draftBusy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}继续草稿
              </button>
            ) : hasVersion ? (
              canEdit ? (
                <button
                  onClick={() => { setChangeFormOpen((v) => !v); setChangeError(null); }}
                  className="semovix-btn-primary"
                  title="基于当前正式版本创建变更草稿"
                >
                  <Plus className="h-3.5 w-3.5"/>创建变更
                </button>
              ) : (
                <span className="text-[12px] text-slate-400" title="当前演示身份为只读">创建变更（需编辑权限）</span>
              )
            ) : (
              <button onClick={() => void goDraft()} disabled={draftBusy} className="semovix-btn-primary" title="进入初始草稿继续建模">
                {draftBusy && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}<Hammer className="h-3.5 w-3.5"/>继续建模
              </button>
            )}
          </div>
        </td>
      </tr>
      {(draftError || changeFormOpen) && (
        <tr>
          <td colSpan={5} className="bg-slate-50/70">
            {draftError && <p className="text-[12px] text-red-600 px-1 py-1">{draftError}</p>}
            {changeFormOpen && (
              <div className="px-1 py-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={changeForm.name}
                    onChange={(e) => setChangeForm((f) => ({...f, name: e.target.value}))}
                    placeholder="变更名称，例如：新增供应商对象"
                    className="flex-1 min-w-56 px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <input
                    value={changeForm.reason}
                    onChange={(e) => setChangeForm((f) => ({...f, reason: e.target.value}))}
                    placeholder="变更原因（可空，将使用默认说明）"
                    className="flex-1 min-w-56 px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[12px] text-slate-400">
                  基于 {model.currentVersionId ?? '（无正式版本）'} → 目标 {nextTargetVersion(model.currentVersionId)}
                </p>
                {changeError && <p className="text-[12px] text-red-600">{changeError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={submitChangeSet}
                    disabled={createChangeSet.isPending}
                    className="semovix-btn-primary"
                  >
                    {createChangeSet.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}创建并进入草稿
                  </button>
                  <button
                    onClick={() => setChangeFormOpen(false)}
                    className="semovix-btn-outline"
                  >
                    收起
                  </button>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
