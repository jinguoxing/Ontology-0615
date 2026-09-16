/**
 * 业务本体表格（Batch 4.5 第三节 · Batch 4.6 状态动作统一）。
 *
 * 业务本体（origin=TENANT）紧凑表格：
 * - 默认隐藏 modelId、changeSetId、ownerRef 原始值（责任方显示展示名称，
 *   见 presentation.ts；完整原始值在模型内页的诊断信息中）。
 * - 主操作按模型状态唯一（ModelPrimaryAction 统一推导）：有草稿 → 继续草稿；
 *   有正式版本无草稿 → 创建变更（行内展开表单）；尚未发布 → 重新开始建模
 *   （创建初始 ChangeSet 后进入对象类型页，不再出现无草稿可进的无效入口）。
 * - 次操作（查看正式版本）为文本按钮。
 * - 不伪造更新时间、业务域与健康评分（契约未提供这些字段）。
 */
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {CheckCircle2, FileClock} from 'lucide-react';
import {ontologyLocation} from '../api/ontology-v1/routeContext';
import type {ModelSummary} from '../api/ontology-v1/types.generated';
import {ownerDisplayName} from '../ontology/presentation';
import ModelPrimaryAction, {CreateChangeSetForm} from './ModelPrimaryAction';

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
  const navigate = useNavigate();
  const [changeFormOpen, setChangeFormOpen] = useState(false);

  const hasDraft = Boolean(model.activeChangeSetId);
  const hasVersion = Boolean(model.currentVersionId);

  const goVersion = () => {
    if (!model.currentVersionId) return;
    navigate(ontologyLocation({modelId: model.id, tab: 'overview', view: {versionId: model.currentVersionId}}));
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
              查看正式版本
            </button>
            {/* 主操作：按状态唯一（ModelPrimaryAction 统一推导） */}
            <ModelPrimaryAction
              model={model}
              canEdit={canEdit}
              onRequestCreateChange={() => { setChangeFormOpen((v) => !v); }}
            />
          </div>
        </td>
      </tr>
      {changeFormOpen && (
        <tr>
          <td colSpan={5} className="bg-slate-50/70">
            <CreateChangeSetForm model={model} onDone={() => setChangeFormOpen(false)}/>
          </td>
        </tr>
      )}
    </>
  );
}
