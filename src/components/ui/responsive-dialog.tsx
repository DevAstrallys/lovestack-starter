import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Extra classes on the content wrapper */
  className?: string;
  /** Footer pinned at bottom (e.g. reply form) */
  footer?: React.ReactNode;
}

/**
 * Adaptive container: Drawer from bottom on mobile, centered Dialog on desktop.
 * Drop-in replacement for Dialog in data-entry / detail views.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn('max-h-[92vh] flex flex-col', className)}>
          {(title || description) && (
            <DrawerHeader className="shrink-0 text-left">
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
            {children}
          </ScrollArea>
          {footer && (
            <div className="px-4 py-3 border-t border-border shrink-0 bg-muted/30">
              {footer}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-3xl max-h-[90vh] p-0 flex flex-col', className)}>
        {(title || description) && (
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
            {children}
          </div>
        </ScrollArea>
        {footer && (
          <div className="px-6 py-4 border-t border-border shrink-0 bg-muted/30">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
