// Utilitaires pour les tickets selon le cahier des charges

export type InitialityType = 'initial' | 'relance';

/**
 * Construit le label d'initialité selon le cahier des charges
 */
export function buildInitialityLabel(initiality: InitialityType, relanceIndex?: number): string {
  return initiality === 'relance' ? `Relance #${relanceIndex ?? 1}` : 'Initial';
}

/**
 * Construit le titre automatique du ticket selon le template
 * "[{initiality}] - [{action}] - [{category}] - [{object}]"
 */
export function buildTicketTitle(params: {
  initiality: InitialityType;
  action: string;
  category: string;
  object: string;
  relanceIndex?: number;
}): string {
  const { initiality, action, category, object, relanceIndex } = params;
  const initialityLabel = buildInitialityLabel(initiality, relanceIndex);
  
  return `[${initialityLabel}] - [${action}] - [${category}] - [${object}]`;
}

/**
 * Template de titre tel que défini dans le cahier des charges
 */
export const TITLE_TEMPLATE = "[{initiality}] - [{action}] - [{category}] - [{object}]";

/**
 * Options d'initialité disponibles
 */
export const INITIALITY_OPTIONS = ["Initial", "Relance"] as const;

/**
 * Statuts de tickets possibles
 */
export const TICKET_STATUSES = {
  open: 'Ouvert',
  in_progress: 'En cours',
  waiting: 'En attente',
  resolved: 'Résolu',
  closed: 'Fermé'
} as const;

/**
 * Priorités disponibles
 */
export const TICKET_PRIORITIES = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  urgent: 'Urgente'
} as const;