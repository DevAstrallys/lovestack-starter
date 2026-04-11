/**
 * /src/components/tickets/shared/FormNavigation.tsx
 *
 * Shared navigation bar for multi-step ticket forms.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { TOTAL_STEPS } from './constants';

interface FormNavigationProps {
  step: number;
  canProceed: boolean;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function FormNavigation({
  step, canProceed, submitting,
  onPrevious, onNext, onSubmit,
}: FormNavigationProps) {
  return (
    <>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Étape {step} / {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-2" />
      </div>

      {/* Navigation buttons — rendered at the bottom by the parent */}
    </>
  );
}

export function FormNavigationButtons({
  step, canProceed, submitting,
  onPrevious, onNext, onSubmit,
}: FormNavigationProps) {
  return (
    <div className="flex gap-3 pt-2">
      {step > 1 && (
        <Button type="button" variant="outline" onClick={onPrevious} className="min-h-[44px]">
          <ArrowLeft className="mr-1 h-4 w-4" /> Précédent
        </Button>
      )}
      <div className="flex-1" />
      {step < TOTAL_STEPS ? (
        <Button type="button" onClick={onNext} disabled={!canProceed} className="min-h-[44px]">
          Suivant <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" onClick={onSubmit} disabled={submitting || !canProceed} className="min-h-[44px]">
          {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
          {submitting ? 'Envoi...' : 'Créer le ticket'}
        </Button>
      )}
    </div>
  );
}
