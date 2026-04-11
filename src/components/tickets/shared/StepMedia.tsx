/**
 * /src/components/tickets/shared/StepMedia.tsx
 *
 * Step 3: "Détails & Médias" — description, uploads, signature, notifications.
 * Used by both public and internal forms.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Camera, Video, Mic, FileText, X, Loader2 } from 'lucide-react';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { SignaturePad } from '@/components/report/SignaturePad';
import type { UploadedFile } from './constants';

type NotifChannel = 'email' | 'sms' | 'app' | 'none';
type MediaMenuType = 'photo' | 'video' | 'audio' | null;

interface StepMediaProps {
  description: string;
  onDescriptionChange: (val: string) => void;
  notifChannel: NotifChannel;
  onNotifChannelChange: (val: NotifChannel) => void;
  signatureDataUrl: string | null;
  onSignatureChange: (val: string | null) => void;
  requireSignature: boolean;
  /** Show "Application (bientôt)" option */
  showAppNotifOption?: boolean;
  // Media capture (from useMediaCapture hook)
  uploadedFiles: UploadedFile[];
  uploading: boolean;
  cameraOpen: boolean;
  recordingAudio: boolean;
  recordingVideo: boolean;
  cameraVideoRef: React.RefObject<HTMLVideoElement>;
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  startCameraCapture: () => void;
  stopCameraStream: () => void;
  capturePhoto: () => void;
  toggleAudioRecording: () => void;
  toggleVideoRecording: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => void;
  removeFile: (index: number) => void;
  /** Optional: extra content before media buttons (e.g., duplicate detection) */
  children?: React.ReactNode;
}

export function StepMedia({
  description, onDescriptionChange,
  notifChannel, onNotifChannelChange,
  signatureDataUrl, onSignatureChange, requireSignature,
  showAppNotifOption = false,
  uploadedFiles, uploading, cameraOpen, recordingAudio, recordingVideo,
  cameraVideoRef, videoPreviewRef,
  startCameraCapture, stopCameraStream, capturePhoto,
  toggleAudioRecording, toggleVideoRecording,
  handleFileUpload, removeFile,
  children,
}: StepMediaProps) {
  const [mediaMenu, setMediaMenu] = useState<MediaMenuType>(null);

  return (
    <TicketFormStep title="Étape 3 — Détails & Médias">
      {/* Extra content (e.g., duplicate detection) */}
      {children}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="tf-description">Description *</Label>
        <Textarea
          id="tf-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Décrivez le problème ou la demande en détail..."
          className="min-h-[100px]"
        />
      </div>

      {/* Media upload */}
      <div className="space-y-3">
        <Label>Pièces jointes</Label>

        <div className="grid grid-cols-2 gap-3">
          {/* Photo */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setMediaMenu(mediaMenu === 'photo' ? null : 'photo')}
              disabled={uploading}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[80px] ${
                mediaMenu === 'photo' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            {mediaMenu === 'photo' && (
              <div className="mt-1 flex flex-col gap-1 rounded-lg border border-border bg-card p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => { setMediaMenu(null); startCameraCapture(); }}
                  className="text-xs text-left px-2 py-1.5 rounded hover:bg-accent"
                >
                  📸 Prendre une photo
                </button>
                <label className="text-xs text-left px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
                  📁 Choisir un fichier
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { setMediaMenu(null); handleFileUpload(e, 'image'); }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Video */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setMediaMenu(mediaMenu === 'video' ? null : 'video')}
              disabled={uploading}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[80px] ${
                mediaMenu === 'video' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <Video className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Vidéo</span>
            </button>
            {mediaMenu === 'video' && (
              <div className="mt-1 flex flex-col gap-1 rounded-lg border border-border bg-card p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => { setMediaMenu(null); toggleVideoRecording(); }}
                  className="text-xs text-left px-2 py-1.5 rounded hover:bg-accent"
                >
                  🎥 Enregistrer une vidéo
                </button>
                <label className="text-xs text-left px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
                  📁 Choisir un fichier
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => { setMediaMenu(null); handleFileUpload(e, 'video'); }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Audio */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setMediaMenu(mediaMenu === 'audio' ? null : 'audio')}
              disabled={uploading}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[80px] ${
                mediaMenu === 'audio' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <Mic className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Audio</span>
            </button>
            {mediaMenu === 'audio' && (
              <div className="mt-1 flex flex-col gap-1 rounded-lg border border-border bg-card p-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => { setMediaMenu(null); toggleAudioRecording(); }}
                  className="text-xs text-left px-2 py-1.5 rounded hover:bg-accent"
                >
                  {recordingAudio ? '⏹️ Arrêter l\'enregistrement' : '🎙️ Enregistrer un audio'}
                </button>
                <label className="text-xs text-left px-2 py-1.5 rounded hover:bg-accent cursor-pointer">
                  📁 Choisir un fichier
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => { setMediaMenu(null); handleFileUpload(e, 'audio'); }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Document */}
          <label
            htmlFor="tf-upload-doc"
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border bg-card hover:border-primary/50 transition-all min-h-[80px] cursor-pointer ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Document</span>
          </label>
          <input
            id="tf-upload-doc"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFileUpload(e, 'document')}
          />
        </div>

        {/* Camera preview */}
        {cameraOpen && (
          <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full rounded-md border border-border bg-muted" />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={stopCameraStream}>Annuler</Button>
              <Button type="button" onClick={capturePhoto}>📸 Capturer</Button>
            </div>
          </div>
        )}

        {/* Video preview */}
        {recordingVideo && (
          <div className="rounded-lg border border-primary bg-primary/5 p-3 space-y-3">
            <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full rounded-md border border-border bg-muted" />
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs text-muted-foreground flex-1">Enregistrement vidéo…</span>
              <Button type="button" size="sm" variant="outline" onClick={toggleVideoRecording}>⏹️ Stop</Button>
            </div>
          </div>
        )}

        {/* Audio indicator */}
        {recordingAudio && (
          <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-3">
            <span className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs text-muted-foreground flex-1">Enregistrement audio…</span>
            <Button type="button" size="sm" variant="outline" onClick={toggleAudioRecording}>⏹️ Stop</Button>
          </div>
        )}

        {uploading && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Upload en cours...
          </p>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-1">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate">{f.type} — {f.name}</span>
                <button type="button" onClick={() => removeFile(i)}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signature */}
      {requireSignature && (
        <div className="space-y-2">
          <Label>Signature numérique (obligatoire)</Label>
          <SignaturePad value={signatureDataUrl} onChange={onSignatureChange} />
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-2 pt-2">
        <Label>Notifications</Label>
        <RadioGroup
          value={notifChannel}
          onValueChange={(v) => onNotifChannelChange(v as NotifChannel)}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="email" id="tf-n-email" />
            <Label htmlFor="tf-n-email" className="font-normal">Par email</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="sms" id="tf-n-sms" />
            <Label htmlFor="tf-n-sms" className="font-normal">Par SMS</Label>
          </div>
          {showAppNotifOption && (
            <div className="flex items-center gap-2 opacity-50">
              <RadioGroupItem value="app" id="tf-n-app" disabled />
              <Label htmlFor="tf-n-app" className="font-normal">Application</Label>
              <Badge variant="secondary" className="text-[10px] ml-1">Bientôt disponible</Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
            <RadioGroupItem value="none" id="tf-n-none" />
            <Label htmlFor="tf-n-none" className="font-normal">Aucune</Label>
          </div>
        </RadioGroup>
      </div>
    </TicketFormStep>
  );
}
