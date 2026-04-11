/**
 * /src/components/tickets/shared/StepDiagnostic.tsx
 *
 * Step 2: "Quoi & Où?" — taxonomy selection and urgency.
 * Used by both public and internal forms.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { URGENCY_LEVELS } from './constants';
import type { TaxAction, TaxCategory, TaxObject, TaxDetail } from '@/types';
import type { TaxonomySelectionState, TaxonomySelectionActions } from './useTaxonomySelection';

interface StepDiagnosticProps {
  taxonomy: TaxonomySelectionState & TaxonomySelectionActions;
  /** Deduplicated + filtered actions to display */
  actions: TaxAction[];
  /** Categories filtered by selected action */
  categories: TaxCategory[];
  /** Objects filtered by selected category */
  objects: TaxObject[];
  /** Details filtered by selected object (optional — only internal form uses this) */
  details?: TaxDetail[];
  /** Whether to show free category option (public form has it, internal might not) */
  showFreeCategoryOption?: boolean;
  /** Optional: extra content rendered after urgency (e.g., location selector) */
  children?: React.ReactNode;
}

export function StepDiagnostic({
  taxonomy: tax,
  actions,
  categories,
  objects,
  details = [],
  showFreeCategoryOption = true,
  children,
}: StepDiagnosticProps) {
  return (
    <TicketFormStep title="Étape 2 — Diagnostic">
      {/* A) Actions */}
      <div className="space-y-2">
        <Label>Que souhaitez-vous faire ? *</Label>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => tax.selectAction(a)}
              className={`p-4 rounded-lg border-2 text-center text-sm font-medium transition-all min-h-[60px] ${
                tax.actionId === a.id
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              {a.label}
              {a.description && (
                <span className="block text-xs text-muted-foreground mt-1">{a.description}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* B) Initiality */}
      {tax.actionId && (
        <div className="space-y-2">
          <Label>Type *</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['initial', 'relance'] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => tax.setInitiality(val)}
                className={`p-3 rounded-lg border-2 text-sm font-medium min-h-[44px] capitalize ${
                  tax.initiality === val ? 'border-primary bg-primary/10 shadow-md' : 'border-border'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          {tax.initiality === 'relance' && (
            <div className="space-y-1 mt-2">
              <Label htmlFor="relanceCode">Code de suivi initial</Label>
              <Input
                id="relanceCode"
                value={tax.relanceCode}
                onChange={(e) => tax.setRelanceCode(e.target.value.toUpperCase())}
                placeholder="AB12-CD34"
                className="font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* C) Category */}
      {tax.actionId && (
        <div className="space-y-2">
          <Label>Catégorie *</Label>
          {!tax.showFreeCategory ? (
            <>
              <Select value={tax.categoryId || undefined} onValueChange={(id) => tax.selectCategory(id, categories)}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showFreeCategoryOption && (
                <button
                  type="button"
                  onClick={tax.enableFreeCategory}
                  className="text-xs text-primary hover:underline"
                >
                  Je ne trouve pas la bonne catégorie
                </button>
              )}
            </>
          ) : (
            <>
              <Input
                value={tax.freeCategory}
                onChange={(e) => tax.setFreeCategory(e.target.value)}
                placeholder="Décrivez la catégorie..."
              />
              <button
                type="button"
                onClick={tax.disableFreeCategory}
                className="text-xs text-muted-foreground hover:underline"
              >
                ← Revenir à la liste
              </button>
            </>
          )}
        </div>
      )}

      {/* D) Object */}
      {(tax.categoryId || (tax.showFreeCategory && tax.freeCategory.trim())) && (
        <div className="space-y-2">
          <Label>Objet *</Label>
          {!tax.showFreeObject && !tax.showFreeCategory ? (
            <>
              <Select
                value={tax.objectId || undefined}
                onValueChange={(id) => tax.selectObject(id, objects)}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Choisir un objet" />
                </SelectTrigger>
                <SelectContent>
                  {objects.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                  <SelectItem value="__other__" className="text-muted-foreground italic">
                    Autre problème…
                  </SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={tax.enableFreeObject}
                className="text-xs text-primary hover:underline"
              >
                Je ne trouve pas le bon objet
              </button>
            </>
          ) : (
            <>
              <Textarea
                value={tax.freeObject}
                onChange={(e) => tax.setFreeObject(e.target.value)}
                placeholder="Décrivez l'objet..."
                rows={2}
              />
              {!tax.showFreeCategory && (
                <button
                  type="button"
                  onClick={tax.disableFreeObject}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  ← Revenir à la liste
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* D-bis) Detail (optional 4th level) */}
      {tax.objectId && details.length > 0 && (
        <div className="space-y-2">
          <Label>Nature / Détail</Label>
          <Select value={tax.detailId || undefined} onValueChange={(id) => tax.selectDetail(id, details)}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Préciser (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              {details.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* E) Urgency */}
      {(tax.objectId || (tax.showFreeObject && tax.freeObject.trim()) || (tax.showFreeCategory && tax.freeCategory.trim())) && (
        <div className="space-y-2">
          <Label>Niveau d'urgence *</Label>
          <div className="space-y-2">
            {URGENCY_LEVELS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => tax.setUrgency(u.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-sm font-medium text-left transition-all min-h-[44px] ${
                  tax.urgency === u.value ? u.cls + ' shadow-md ring-2 ring-primary/30' : 'border-border hover:border-primary/40'
                }`}
              >
                <span className="text-lg">{u.dot}</span>
                <span>{u.value} — {u.label}</span>
                {u.sla && <span className="ml-auto text-xs text-muted-foreground">{u.sla}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extra content (location selector, etc.) */}
      {children}

      {/* F) Title preview */}
      {tax.actionId && (tax.categoryId || tax.showFreeCategory) && (tax.objectId || (tax.showFreeObject && tax.freeObject.trim())) && (
        <div className="rounded-md bg-muted p-3">
          <Label className="text-xs text-muted-foreground">Titre du ticket (auto-généré)</Label>
          <p className="mt-1 text-sm font-mono">{tax.buildTitle()}</p>
        </div>
      )}
    </TicketFormStep>
  );
}
