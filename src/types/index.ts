/**
 * /src/types/index.ts
 *
 * Centralized type registry for Astra-Link.
 * Every domain re-exports from here so consumers have a single import point:
 *
 *   import type { Ticket, Organization, LocationElement } from '@/types';
 *
 * Rule: NO `any` on business entities. NO inline interface duplication.
 * If a type is used in more than one file, it lives here.
 */

export type {
  TicketStatus,
  TicketPriority,
  Ticket,
  EnrichedTicket,
  TicketActivity,
  TicketActivityMeta,
  TicketAttachment,
  TicketFilters,
  TicketLocation,
  TicketMeta,
  DuplicateCandidate,
} from './ticket';

export type {
  Organization,
  WhiteLabelConfig,
} from './organization';

export type {
  Profile,
  Membership,
  LocationMembership,
  Role,
  Permission,
  RolePermission,
  UserLocationMembership,
  NotificationPrefs,
} from './user';

export type {
  LocationData,
  LocationEnsemble,
  LocationGroup,
  LocationElement,
  LocationTag,
  LocationHierarchy,
} from './location';

export type {
  QRCode,
  QRCodeFormConfig,
  QRCodeTemplate,
} from './qr-code';

export type {
  TaxAction,
  TaxCategory,
  TaxObject,
  TaxDetail,
  TaxSuggestion,
  TaxSuggestionContext,
  LocationOverride,
} from './taxonomy';

export type {
  Company,
  CompanyUser,
} from './company';

export type {
  SendEmailParams,
  NotificationType,
} from './notification';

export type {
  Initiality,
} from './enums';
