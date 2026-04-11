/**
 * /src/components/tickets/shared/useMediaCapture.ts
 *
 * Hook encapsulating all media capture logic: photo, audio, video, file upload.
 * Extracted from TicketForm.tsx and TicketCreateForm.tsx to eliminate duplication.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import { uploadFile as uploadToStorage } from '@/services/storage';
import { useToast } from '@/hooks/use-toast';
import type { UploadedFile } from './constants';

const log = createLogger('hook:useMediaCapture');

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function useMediaCapture() {
  const { toast } = useToast();

  // --- State ---
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);

  // --- Refs ---
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (audioRecorderRef.current?.state === 'recording') audioRecorderRef.current.stop();
      if (videoRecorderRef.current?.state === 'recording') videoRecorderRef.current.stop();
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      videoStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // --- Core upload ---
  const uploadFile = useCallback(
    async (file: File, fileType: string) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Fichier trop volumineux (max 20 Mo)', variant: 'destructive' });
        return;
      }
      setUploading(true);
      try {
        const result = await uploadToStorage(
          'ticket-attachments',
          `${crypto.randomUUID()}.${file.name.split('.').pop() || 'bin'}`,
          file,
        );
        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, url: result.publicUrl, type: fileType, storagePath: result.path },
        ]);
        log.info('File uploaded', { fileName: file.name, fileType });
      } catch (err) {
        log.error('File upload failed', { fileName: file.name, error: err });
        toast({ title: 'Erreur upload', variant: 'destructive' });
      } finally {
        setUploading(false);
      }
    },
    [toast],
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await uploadFile(file, fileType);
      e.target.value = '';
    },
    [uploadFile],
  );

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Camera ---
  const stopCameraStream = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
  }, []);

  const startCameraCapture = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: 'Caméra non supportée', variant: 'destructive' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
      });
    } catch (err) {
      log.error('Camera access denied', { error: err });
      toast({ title: 'Accès caméra refusé', variant: 'destructive' });
    }
  }, [toast]);

  const capturePhoto = useCallback(async () => {
    const video = cameraVideoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        await uploadFile(file, 'image');
        stopCameraStream();
      },
      'image/jpeg',
      0.92,
    );
  }, [uploadFile, stopCameraStream]);

  // --- Audio ---
  const toggleAudioRecording = useCallback(async () => {
    if (recordingAudio && audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      setRecordingAudio(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      const fallback = document.getElementById('upload-audio-fallback') as HTMLInputElement | null;
      fallback?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: mimeType });
        await uploadFile(file, 'audio');
        audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecordingAudio(true);
    } catch (err) {
      log.error('Audio recording failed', { error: err });
      toast({ title: 'Accès micro refusé', variant: 'destructive' });
    }
  }, [recordingAudio, uploadFile, toast]);

  // --- Video ---
  const toggleVideoRecording = useCallback(async () => {
    if (recordingVideo && videoRecorderRef.current) {
      videoRecorderRef.current.stop();
      setRecordingVideo(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast({ title: 'Enregistrement vidéo non supporté', variant: 'destructive' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      });
      videoStreamRef.current = stream;
      setRecordingVideo(true);
      requestAnimationFrame(() => {
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      });
      const recorder = new MediaRecorder(stream);
      videoRecorderRef.current = recorder;
      videoChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(videoChunksRef.current, { type: mimeType });
        const file = new File([blob], `video-${Date.now()}.${ext}`, { type: mimeType });
        await uploadFile(file, 'video');
        videoStreamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
    } catch (err) {
      log.error('Video recording failed', { error: err });
      toast({ title: 'Accès caméra/micro refusé', variant: 'destructive' });
    }
  }, [recordingVideo, uploadFile, toast]);

  return {
    // State
    uploadedFiles,
    uploading,
    cameraOpen,
    recordingAudio,
    recordingVideo,
    // Refs (for JSX)
    cameraVideoRef,
    videoPreviewRef,
    // Actions
    uploadFile,
    handleFileUpload,
    removeFile,
    startCameraCapture,
    stopCameraStream,
    capturePhoto,
    toggleAudioRecording,
    toggleVideoRecording,
    // Setter (for external reset)
    setUploadedFiles,
  };
}
