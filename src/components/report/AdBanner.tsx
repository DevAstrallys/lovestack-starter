import { Megaphone } from 'lucide-react';

export function AdBanner() {
  return (
    <div className="w-full rounded-lg border border-dashed border-border bg-muted/50 p-4 flex items-center gap-3">
      <Megaphone className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">Espace publicitaire — Passez à la version Premium pour retirer cette bannière</p>
      </div>
    </div>
  );
}
