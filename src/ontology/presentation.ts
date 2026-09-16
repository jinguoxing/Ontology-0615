/**
 * 展示层辅助（Batch 4.5）：产品语言与工程值的边界。
 *
 * - ownerDisplayName：产品界面显示责任方展示名称，原始 ownerRef 不再直接
 *   出现在模型头 / 列表（未登记的引用原样返回，不伪造名称）。
 * - diagnosticsVisible：诊断信息入口的可见性裁决——开发构建且显式开启
 *   VITE_ENABLE_ONTOLOGY_DIAGNOSTICS=true，或会话具备
 *   ontology.diagnostics.read 能力（当前演示服务未发放该能力）。
 *   生产构建且无能力时入口不渲染，viewer 默认不可见。
 * - shortId：产品层只显示截断标识（前 8 位 + …），完整值在诊断信息抽屉。
 */

/** 已知责任方的展示名称映射；未登记的引用原样返回。 */
const OWNER_DISPLAY_NAMES: Record<string, string> = {
  'platform-team': '平台团队',
  'public-service-team': '公共服务团队',
};

export function ownerDisplayName(ownerRef: string): string {
  return OWNER_DISPLAY_NAMES[ownerRef] ?? ownerRef;
}

/** 诊断入口是否可见（第七节）。 */
export function diagnosticsVisible(capabilities: string[]): boolean {
  const devEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_ONTOLOGY_DIAGNOSTICS === 'true';
  return devEnabled || capabilities.includes('ontology.diagnostics.read');
}

/** 产品层截断标识：保留前 8 位 + 省略号（完整值见诊断信息）。 */
export function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  return id.length <= 8 ? id : `${id.slice(0, 8)}…`;
}
