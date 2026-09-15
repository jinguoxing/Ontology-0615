/**
 * 编辑权限策略（Batch 2.1）。
 *
 * 页面不直接用 `origin !== 'EXTERNAL'` 之类的单字段判断可否编辑，而是把
 * SYSTEM / LOCAL / EXTERNAL 放在完整上下文里判断：
 *
 * 1. 草稿状态：只有 changeSetId+revision 的 OPEN 草稿视图可写
 *    （ResolvedView.readOnly === false）。正式版本（versionId）一律只读。
 * 2. Session Capability：GET /session 返回的 capabilities 必须含
 *    ontology.edit（demo-viewer 只读）。
 * 3. 类型来源：EXTERNAL 为外部契约引用，永不可写；SYSTEM 模型（如
 *    drkn-core）内置类型 origin=SYSTEM、业务本体自建类型 origin=LOCAL，
 *    两者在草稿中同样可编辑——模型类型决定的是来源语义与展示，不额外
 *    收紧写权限。
 *
 * 以上只是界面预判；服务端保持最终裁决（403 ACTION_DENIED /
 * EXTERNAL_READ_ONLY / 412 / 422），界面必须把拒绝原样呈现而不是吞掉。
 */
import type {ModelSummary, ResolvedView} from '../api/ontology-v1/types.generated';

export type ElementOrigin = 'LOCAL' | 'SYSTEM' | 'EXTERNAL';

export type EditDenyReason =
  | 'loading' // 视图/会话尚未就绪
  | 'published-version' // 正式版本只读
  | 'viewer-permission' // 身份无 ontology.edit（服务端会 403）
  | 'external-reference'; // 外部契约引用（服务端 EXTERNAL_READ_ONLY）

/** 每个拒绝原因对应的服务端最终防线，用于界面解释。 */
export const SERVER_GUARD: Record<Exclude<EditDenyReason, 'loading'>, string> = {
  'published-version': '已发布版本不可直接编辑，修改需创建变更草稿后进行',
  'viewer-permission': '服务端同样会拒绝该身份的写入（非仅界面隐藏）',
  'external-reference': '权威定义在外部契约包，本页不提供编辑',
};

export interface EditPolicyInput {
  /** 元素（对象类型/关系端点等）的 origin；未知时按 EXTERNAL 保守处理。 */
  origin: ElementOrigin | undefined;
  /** 所属模型摘要：SYSTEM 模型 / TENANT 业务本体（决定来源语义，不决定可否编辑）。 */
  model: ModelSummary | undefined;
  /** 已解析视图：草稿状态由 view.readOnly 与 mode=DRAFT 表达。 */
  view: ResolvedView | undefined;
  /** GET /session 的 capabilities。 */
  capabilities: string[] | undefined;
}

export interface EditPolicyResult {
  editable: boolean;
  /** 不可编辑的原因（editable=true 时为 null）。 */
  reason: EditDenyReason | null;
  /** 该模型下此 origin 的语义说明（界面徽标/提示用）。 */
  originNote: string;
}

const ORIGIN_NOTES: Record<ElementOrigin, string> = {
  LOCAL: '本模型自建定义，草稿中可编辑',
  SYSTEM: '系统模型内置定义，在自身草稿中可编辑',
  EXTERNAL: '外部契约包引用，只读（权威定义在外部契约包）',
};

export function editPolicy({origin, model, view, capabilities}: EditPolicyInput): EditPolicyResult {
  const note = ORIGIN_NOTES[origin ?? 'EXTERNAL'];
  // 1) 视图未就绪。
  if (!view) {
    return {editable: false, reason: 'loading', originNote: note};
  }
  // 2) Session Capability：无 ontology.edit 只读（服务端 403 兜底）。先于视图判断：
  //    viewer 读草稿时服务端也会给 readOnly=true，但真实原因是权限而非版本。
  if (!capabilities?.includes('ontology.edit')) {
    return {editable: false, reason: 'viewer-permission', originNote: note};
  }
  // 3) 草稿状态：正式版本（readOnly）只读。
  if (view.readOnly) {
    return {editable: false, reason: 'published-version', originNote: note};
  }
  // 4) 类型来源：EXTERNAL 永不可写；LOCAL/SYSTEM 在草稿中可编辑。
  //    （model.origin 只影响语义说明：SYSTEM 模型的内置类型在自身草稿中可编辑。）
  if ((origin ?? 'EXTERNAL') === 'EXTERNAL') {
    return {editable: false, reason: 'external-reference', originNote: note};
  }
  return {editable: true, reason: null, originNote: note};
}
