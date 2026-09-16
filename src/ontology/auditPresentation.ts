/**
 * 审计信息产品化（Batch 4.6 第六节）。
 *
 * 产品页面（模型总览「最近事件」、版本与发布「审计记录」）不再呈现
 * 工程枚举（eventType）与演示账号名（actorId），统一映射为产品语言：
 * - auditEventLabel：eventType → 事件名称（未登记的事件回落为中性标签）；
 * - auditActorLabel：actorId → 身份名称（未登记的身份回落为中性标签）；
 * - auditTargetLabel：目标标识按形态呈现（版本号原样，其余截断）。
 * 原始值不丢弃：调用方以 title 提示携带，完整值在诊断信息中可见。
 */
import {shortId} from './presentation';

/** 事件类型 → 产品语言。覆盖 Mock 服务会产生的全部事件。 */
const EVENT_LABELS: Record<string, string> = {
  MODEL_CREATED: '创建本体模型',
  CHANGESET_CREATED: '创建编辑草稿',
  MODEL_DRAFT_CHANGED: '更新模型定义',
  VALIDATION_STARTED: '运行模型校验',
  IMPACT_STARTED: '运行影响分析',
  ONTOLOGY_VERSION_PUBLISHED: '发布正式版本',
  CHANGESET_ABANDONED: '放弃编辑草稿',
  ACTION_CONTRACT_SIMULATED: '模拟验证行动契约',
};

/** 演示身份 → 产品语言。 */
const ACTOR_LABELS: Record<string, string> = {
  'demo-maintainer': '维护人员',
  'demo-viewer': '只读用户',
};

export function auditEventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? '模型事件';
}

export function auditActorLabel(actorId: string): string {
  return ACTOR_LABELS[actorId] ?? '未登记身份';
}

const VERSION_LIKE = /^v\d+\.\d+\.\d+/;

/** 版本号一类目标原样呈现，其余标识截断（完整值见诊断信息）。 */
export function auditTargetLabel(targetId: string | null | undefined): string {
  if (!targetId) return '';
  return VERSION_LIKE.test(targetId) ? targetId : shortId(targetId);
}
