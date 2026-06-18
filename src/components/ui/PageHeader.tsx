import {type ReactNode} from 'react';
import {cn} from '../../lib/utils';

/**
 * Shared workspace page header.
 *
 * Several ontology pages (RelationModel, CapabilityBinding, WorkflowOrchestrator,
 * ChangeRelease) share an identical header skeleton: a top row of breadcrumb +
 * right-aligned change-set indicator, and a second row with the title block +
 * action buttons. Only the inner content differs, so this component owns the
 * layout/spacing and the page fills in the slots.
 *
 * The className strings are copied verbatim from the original inline markup so
 * the rendered output is pixel-identical to before extraction.
 */

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  /** Breadcrumb segments rendered left-to-right, separated by "/". The last
   * segment is rendered as the active (bold) crumb. */
  breadcrumbs: BreadcrumbItem[];
  /** Right-aligned content on the top row (typically the change-set pill). */
  topRight?: ReactNode;
  /** Second row content (title block on the left, action buttons on the right). */
  titleRow: ReactNode;
  className?: string;
}

export function PageHeader({breadcrumbs, topRight, titleRow, className}: PageHeaderProps) {
  return (
    <div className={cn('mb-5 space-y-1.5 shrink-0', className)}>
      {/* 第一行：面包屑与常驻右侧的变更沙箱指示 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-[12px] text-slate-400 font-semibold tracking-wide">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={i} className="contents">
                {isLast ? (
                  <span className="text-slate-800 font-black">{crumb.label}</span>
                ) : (
                  <span
                    className="hover:text-blue-600 cursor-pointer transition-colors"
                    onClick={crumb.onClick}
                  >
                    {crumb.label}
                  </span>
                )}
                {!isLast && <span className="mx-2 text-slate-300">/</span>}
              </span>
            );
          })}
        </div>
        {topRight}
      </div>

      {/* 第二行：核心大标题与功能按钮面板 */}
      {titleRow}
    </div>
  );
}
