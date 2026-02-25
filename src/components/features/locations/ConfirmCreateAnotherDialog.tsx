import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConfirmCreateAnotherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementName: string | null;
  onCreateAnother: () => void;
  onFinish: () => void;
}

export const ConfirmCreateAnotherDialog: React.FC<ConfirmCreateAnotherDialogProps> = ({
  open,
  onOpenChange,
  elementName,
  onCreateAnother,
  onFinish,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Élément créé avec succès!</DialogTitle>
        <DialogDescription>
          L'élément "{elementName}" a été créé et son QR code a été généré automatiquement.
          <br />
          Souhaitez-vous créer d'autres éléments à la même adresse?
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onFinish}>Non, terminer</Button>
        <Button onClick={onCreateAnother}>Oui, créer un autre élément</Button>
      </div>
    </DialogContent>
  </Dialog>
);
