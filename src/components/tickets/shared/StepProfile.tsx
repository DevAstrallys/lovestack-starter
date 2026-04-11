/**
 * /src/components/tickets/shared/StepProfile.tsx
 *
 * Step 1: "Qui êtes-vous?" — profile information.
 * Used by both public (TicketForm) and internal (TicketCreateForm) forms.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { PROFILE_ROLES } from './constants';

interface StepProfileProps {
  lastName: string;
  firstName: string;
  profileRole: string;
  phone: string;
  email: string;
  onLastNameChange: (val: string) => void;
  onFirstNameChange: (val: string) => void;
  onRoleChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  /** Optional: extra content rendered after the email field (e.g., location hierarchy) */
  children?: React.ReactNode;
}

export function StepProfile({
  lastName, firstName, profileRole, phone, email,
  onLastNameChange, onFirstNameChange, onRoleChange, onPhoneChange, onEmailChange,
  children,
}: StepProfileProps) {
  return (
    <TicketFormStep title="Étape 1 — Qui êtes-vous ?">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tf-lastName">Nom *</Label>
          <Input
            id="tf-lastName"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Dupont"
            className="min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tf-firstName">Prénom *</Label>
          <Input
            id="tf-firstName"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Marie"
            className="min-h-[44px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rôle *</Label>
        <Select value={profileRole} onValueChange={onRoleChange}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Sélectionner votre rôle" />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tf-phone">Téléphone</Label>
          <Input
            id="tf-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="06 12 34 56 78"
            className="min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tf-email">Email</Label>
          <Input
            id="tf-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="marie@exemple.fr"
            className="min-h-[44px]"
          />
        </div>
      </div>

      {children}
    </TicketFormStep>
  );
}
