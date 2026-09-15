/**
 * 校验 / 影响报告的选中状态编码（Batch 4）。
 *
 * 两份报告的 jobId 存进 URL 的 `selected` 参数（`<validationJobId>|<impactJobId>`），
 * 与其他页面的构件选中同一机制：刷新 / 分享链接可复现，报告内容本体存于
 * 服务端（GET /jobs/:id）与 React Query 缓存，绝不只放组件本地状态。
 *
 * 防御：其他页面切 Tab 时会携带它们的 selectedId（如行动 id），这里只接受
 * `job-` 前缀的片段（服务端任务 id 恒为 job-<uuid>），不匹配则视为未选择。
 */
export interface ReportSelection {
  validationJobId?: string;
  impactJobId?: string;
}

const JOB_ID = /^job-[A-Za-z0-9-]+$/;

export function decodeReportSelection(selected: string | undefined): ReportSelection {
  const [v, i] = (selected ?? '').split('|');
  return {
    validationJobId: v && JOB_ID.test(v) ? v : undefined,
    impactJobId: i && JOB_ID.test(i) ? i : undefined,
  };
}

export function encodeReportSelection(sel: ReportSelection): string | undefined {
  const v = sel.validationJobId && JOB_ID.test(sel.validationJobId) ? sel.validationJobId : '';
  const i = sel.impactJobId && JOB_ID.test(sel.impactJobId) ? sel.impactJobId : '';
  const joined = [v, i].join('|');
  return joined === '|' ? undefined : joined;
}
