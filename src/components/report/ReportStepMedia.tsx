import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { MediaUpload, UploadedFile } from '@/components/tickets/MediaUpload';
import { SignaturePad } from '@/components/report/SignaturePad';

export interface MediaData {
  description: string;
  notification_channel: 'email' | 'sms' | 'none';
}

interface Props {
  data: MediaData;
  onChange: (data: MediaData) => void;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  showSignature: boolean;
  signatureDataUrl: string | null;
  onSignatureChange: (dataUrl: string | null) => void;
}

export function ReportStepMedia({ data, onChange, files, onFilesChange, showSignature, signatureDataUrl, onSignatureChange }: Props) {
  const set = (key: keyof MediaData, value: string) => onChange({ ...data, [key]: value });

  return (
    <TicketFormStep title="Étape 3 — Détails & Médias">
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Décrivez le problème ou la demande en détail..."
          rows={4}
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Pièces jointes (photo, vidéo max 15s, audio, PDF)</Label>
        <MediaUpload files={files} onFilesChange={onFilesChange} />
      </div>

      {showSignature && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label>Signature numérique (obligatoire pour "Je vérifie")</Label>
          <SignaturePad value={signatureDataUrl} onChange={onSignatureChange} />
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Label>Comment souhaitez-vous être informé du suivi ?</Label>
        <RadioGroup
          value={data.notification_channel}
          onValueChange={v => set('notification_channel', v)}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email" id="notif-email" />
            <Label htmlFor="notif-email" className="font-normal cursor-pointer">Par email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sms" id="notif-sms" />
            <Label htmlFor="notif-sms" className="font-normal cursor-pointer">Par SMS</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="notif-none" />
            <Label htmlFor="notif-none" className="font-normal cursor-pointer">Aucune notification</Label>
          </div>
        </RadioGroup>
      </div>
    </TicketFormStep>
  );
}
