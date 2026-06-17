import type {HTMLAttributes} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../../lib/utils';

/**
 * Small inline pill/tag. Replaces the repeated rounded-full meta labels.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-slate-100 border border-slate-200 text-slate-500',
        info: 'bg-blue-50 border border-blue-150 text-blue-700',
        muted: 'bg-slate-100 text-slate-500',
        subtle: 'bg-slate-50 border border-slate-100 text-slate-600',
      },
      size: {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  },
);

// Combine via intersection on the parameter type directly — more robust than an
// interface that some TS configs fail to merge with VariantProps.
type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({className, variant, size, ...props}: BadgeProps) {
  return <span className={cn(badgeVariants({variant, size}), className)} {...props} />;
}

export {badgeVariants};
