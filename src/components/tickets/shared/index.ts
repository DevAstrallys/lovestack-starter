/**
 * /src/components/tickets/shared/index.ts
 *
 * Barrel export for shared ticket form components.
 */
export { TOTAL_STEPS, URGENCY_LEVELS, PROFILE_ROLES } from './constants';
export type { UploadedFile } from './constants';

export { useMediaCapture } from './useMediaCapture';
export { useTaxonomySelection } from './useTaxonomySelection';
export type { TaxonomySelectionState, TaxonomySelectionActions } from './useTaxonomySelection';

export { StepProfile } from './StepProfile';
export { StepDiagnostic } from './StepDiagnostic';
export { StepMedia } from './StepMedia';
export { FormNavigation, FormNavigationButtons } from './FormNavigation';
