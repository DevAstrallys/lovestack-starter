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
 * Résultat : "{Priorité} — {Catégorie} — {Sujet}"
 * Nettoie les crochets et majuscules agressives sans perdre d'information.
 */
export function formatTicketDisplayTitle(ticket: {
  title: string;
  priority?: string | null;
  category_code?: string | null;
}): string {
  const { title, priority, category_code } = ticket;

  // 1. Extract content from [BRACKETS] before removing them
  const bracketContents: string[] = [];
  const bracketRegex = /\[([^\]]*)\]/g;
  let match: RegExpExecArray | null;
  while ((match = bracketRegex.exec(title)) !== null) {
    const content = match[1].trim();
    // Skip if it's a known priority label (already handled separately)
    const priorityValues = Object.values(TICKET_PRIORITIES).map(v => v.toLowerCase());
    const priorityKeys = Object.keys(TICKET_PRIORITIES);
    if (!priorityKeys.includes(content.toLowerCase()) && !priorityValues.includes(content.toLowerCase())) {
      bracketContents.push(content);
    }
  }

  // 2. Clean the raw title: remove [BRACKETS] but keep the rest
  let cleanTitle = title
    .replace(/\[([^\]]*)\]/g, '')  // remove all [...]
    .replace(/\s*>\s*/g, ' — ')    // replace > with em dash
    .replace(/\s*:\s*/g, ' — ')    // replace : with em dash
    .replace(/\s+—\s+/g, ' — ')   // normalize existing em dashes
    .replace(/(?<=\S)\s*-\s*(?=\S)/g, (m, offset, str) => {
      // Only replace standalone separators (space-dash-space), not hyphens in compound words
      return m.includes(' ') ? ' — ' : m;
    })
    .replace(/—\s*—/g, '—')       // collapse double dashes
    .replace(/^\s*—\s*/, '')       // remove leading dash
    .replace(/\s*—\s*$/, '')       // remove trailing dash
    .trim();

  // 3. Split into segments, apply sentence case, and filter empty
  const segments = cleanTitle
    .split(' — ')
    .map(s => s.trim())
    .filter(Boolean);

  // 4. Add bracket contents that aren't already represented
  const allSegments = [...bracketContents, ...segments];
  
  // Deduplicate (case-insensitive)
  const seen = new Set<string>();
  const uniqueSegments = allSegments.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Apply sentence case
  const formattedSegments = uniqueSegments.map(s => toSentenceCase(s));

  // 5. Build final: Priority — Category — Subject
  const priorityLabel = priority ? TICKET_PRIORITIES[priority as keyof typeof TICKET_PRIORITIES] : null;
  const parts: string[] = [];

  if (priorityLabel) parts.push(toSentenceCase(priorityLabel));

  // Add category_code if not already present in segments
  if (category_code) {
    const catLower = category_code.toLowerCase();
    const alreadyPresent = formattedSegments.some(s => s.toLowerCase().includes(catLower));
    if (!alreadyPresent) {
      parts.push(toSentenceCase(category_code));
    }
  }

  // Add all remaining segments
  parts.push(...formattedSegments);

  // Deduplicate final parts (priority label might match a segment)
  const finalSeen = new Set<string>();
  const finalParts = parts.filter(p => {
    const key = p.toLowerCase();
    if (finalSeen.has(key)) return false;
    finalSeen.add(key);
    return true;
  });

  return finalParts.join(' — ') || title;
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