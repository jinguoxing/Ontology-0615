import {forwardRef, type ReactNode} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {cn} from '../../lib/utils';

/**
 * Right-side slide-in drawer built on Radix Dialog (shadcn pattern).
 *
 * Gives us for free (vs the previous hand-written div overlay):
 * - focus trap + restore, ESC to close, body scroll lock
 * - accessible roles (dialog / aria-modal) and proper labelling
 *
 * Composition matches shadcn: <Drawer> + <DrawerContent> with slots.
 */

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;

export const DrawerOverlay = forwardRef<
  HTMLDivElement,
  DialogPrimitive.DialogOverlayProps
>(({className, ...props}, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-[2px]',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = 'DrawerOverlay';

export interface DrawerContentProps
  extends DialogPrimitive.DialogContentProps {
  /** Optional close button shown top-right; set to false to hide. */
  showClose?: boolean;
  /** Max width of the panel, e.g. 'max-w-[480px]'. */
  maxWidth?: string;
  children?: ReactNode;
}

export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  ({className, children, showClose = true, maxWidth = 'max-w-[480px]', ...props}, ref) => (
    <DialogPrimitive.Portal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl',
          maxWidth,
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          'duration-300',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none cursor-pointer"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DrawerContent.displayName = 'DrawerContent';

export function DrawerHeader({children, className}: {children: ReactNode; className?: string}) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function DrawerTitle({children, className}: {children: ReactNode; className?: string}) {
  return (
    <DialogPrimitive.Title className={cn('text-lg font-bold text-slate-800', className)}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DrawerFooter({children, className}: {children: ReactNode; className?: string}) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
