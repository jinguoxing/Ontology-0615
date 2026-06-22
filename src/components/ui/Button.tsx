import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../../lib/utils';

/**
 * Reusable button primitive (shadcn pattern: CVA variants + cn merge).
 * Replaces the repeated hand-written button className strings across the app.
 */
const buttonVariants = cva(
  // base — shared by every variant
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all cursor-pointer focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        // Solid blue primary action.
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5',
        // Outlined neutral (e.g. Cancel).
        secondary:
          'bg-white text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300',
        // Ghost / sidebar item style (transparent, muted).
        ghost:
          'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        // Subtle pill (filter chips, meta).
        subtle:
          'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100',
      },
      size: {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-xs px-5 py-2.5',
        icon: 'p-1.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({className, variant, size, ...props}, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({variant, size}), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

export {buttonVariants};
