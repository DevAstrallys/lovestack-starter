// Utilitaires pour les tickets selon le cahier des charges

export type InitialityType = 'initial' | 'relance';

// ── Sentence case helper ─────────────────────────────────────────────
/** Converts any string to Sentence case: first letter uppercase, rest lowercase */
export function toSentenceCase(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Construit le label d'initialité selon le cahier des charges
 */
export function buildInitialityLabel(initiality: InitialityType, relanceIndex?: number): string {
  return initiality === 'relance' ? `Relance #${relanceIndex ?? 1}` : 'Initial';
}

/**
 * Construit le titre automatique du ticket au format élégant :
 * "{Priorité} — {Catégorie} — {Objet}"
 */
export function buildTicketTitle(params: {
  initiality: InitialityType;
  action: string;
  category: string;
  object: string;
  detail?: string;
  relanceIndex?: number;
}): string {
  const { category, object, detail } = params;
  const parts = [toSentenceCase(category), toSentenceCase(object)];
  if (detail) parts.push(toSentenceCase(detail));
  return parts.join(' — ');
}

/**
 * Formate un titre de ticket pour l'affichage.
 * Supprime les crochets et majuscules agressives.
 * Résultat : "{Priorité} — {Catégorie} — {Titre}"
 */
export function formatTicketDisplayTitle(ticket: {
  title: string;
  priority?: string | null;
  category_code?: string | null;
}): string {
  const { title, priority, category_code } = ticket;

  // Clean the raw title: remove [BRACKETS] patterns
  let cleanTitle = title
    .replace(/\[([^\]]*)\]/g, '') // remove all [...]
    .replace(/\s*>\s*/g, ' — ')   // replace > with em dash
    .replace(/\s*:\s*/g, ' — ')   // replace : with em dash
    .replace(/\s*-\s*/g, ' — ')   // replace - separators with em dash
    .replace(/—\s*—/g, '—')       // collapse double dashes
    .replace(/^\s*—\s*/, '')       // remove leading dash
    .replace(/\s*—\s*$/, '')       // remove trailing dash
    .trim();

  // Apply sentence case to each segment
  cleanTitle = cleanTitle
    .split(' — ')
    .map(s => toSentenceCase(s.trim()))
    .filter(Boolean)
    .join(' — ');

  // Build final display: Priority — Category — Title (avoid duplicates)
  const priorityLabel = priority ? TICKET_PRIORITIES[priority as keyof typeof TICKET_PRIORITIES] : null;
  const parts: string[] = [];

  if (priorityLabel) parts.push(toSentenceCase(priorityLabel));
  if (category_code && !cleanTitle.toLowerCase().includes(category_code.toLowerCase())) {
    parts.push(toSentenceCase(category_code));
  }
  if (cleanTitle) parts.push(cleanTitle);

  return parts.join(' — ') || title;
}

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