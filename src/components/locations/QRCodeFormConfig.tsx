import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QRCodeFormConfigProps {
  qrCode: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface FormConfigData {
  action: string;
  category: string;
  object: string;
  title_template: string;
  actions_list: string[];
  categories_list: string[];
  objects_list: string[];
}

const DEFAULT_CONFIG: FormConfigData = {
  action: '',
  category: '',
  object: '',
  title_template: '[{initiality}] - [{action}] - [{category}] - [{object}]',
  actions_list: ['signaler', 'demander', 'informer'],
  categories_list: ['maintenance', 'nettoyage', 'securite', 'technique'],
  objects_list: ['eclairage', 'chauffage', 'ascenseur', 'porte', 'fenetre', 'autre']
};

export function QRCodeFormConfig({ qrCode, isOpen, onClose, onUpdate }: QRCodeFormConfigProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const currentConfig = qrCode?.form_config && typeof qrCode.form_config === 'object' 
    ? { ...DEFAULT_CONFIG, ...qrCode.form_config } 
    : DEFAULT_CONFIG;
    
  const [formConfig, setFormConfig] = useState<FormConfigData>(currentConfig);
  const [newAction, setNewAction] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newObject, setNewObject] = useState('');

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('qr_codes')
        .update({ form_config: formConfig as any })
        .eq('id', qrCode.id);

      if (error) throw error;

      toast({
        title: 'Configuration sauvegardée',
        description: 'La configuration du formulaire a été mise à jour'
      });
      
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating QR code config:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addAction = () => {
    if (newAction.trim() && !formConfig.actions_list.includes(newAction.trim())) {
      setFormConfig(prev => ({
        ...prev,
        actions_list: [...prev.actions_list, newAction.trim()]
      }));
      setNewAction('');
    }
  };

  const removeAction = (action: string) => {
    setFormConfig(prev => ({
      ...prev,
      actions_list: prev.actions_list.filter(a => a !== action),
      action: prev.action === action ? '' : prev.action
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !formConfig.categories_list.includes(newCategory.trim())) {
      setFormConfig(prev => ({
        ...prev,
        categories_list: [...prev.categories_list, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setFormConfig(prev => ({
      ...prev,
      categories_list: prev.categories_list.filter(c => c !== category),
      category: prev.category === category ? '' : prev.category
    }));
  };

  const addObject = () => {
    if (newObject.trim() && !formConfig.objects_list.includes(newObject.trim())) {
      setFormConfig(prev => ({
        ...prev,
        objects_list: [...prev.objects_list, newObject.trim()]
      }));
      setNewObject('');
    }
  };

  const removeObject = (object: string) => {
    setFormConfig(prev => ({
      ...prev,
      objects_list: prev.objects_list.filter(o => o !== object),
      object: prev.object === object ? '' : prev.object
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration du formulaire
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valeurs par défaut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Action par défaut</Label>
                  <Select 
                    value={formConfig.action} 
                    onValueChange={(value) => setFormConfig(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune sélection</SelectItem>
                      {formConfig.actions_list.map(action => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Catégorie par défaut</Label>
                  <Select 
                    value={formConfig.category} 
                    onValueChange={(value) => setFormConfig(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune sélection</SelectItem>
                      {formConfig.categories_list.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Objet par défaut</Label>
                  <Select 
                    value={formConfig.object} 
                    onValueChange={(value) => setFormConfig(prev => ({ ...prev, object: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune sélection</SelectItem>
                      {formConfig.objects_list.map(object => (
                        <SelectItem key={object} value={object}>
                          {object}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template de titre</Label>
                <Input
                  value={formConfig.title_template}
                  onChange={(e) => setFormConfig(prev => ({ ...prev, title_template: e.target.value }))}
                  placeholder="[{initiality}] - [{action}] - [{category}] - [{object}]"
                />
                <p className="text-sm text-muted-foreground">
                  Variables disponibles: {'{initiality}'}, {'{action}'}, {'{category}'}, {'{object}'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    placeholder="Nouvelle action..."
                    onKeyDown={(e) => e.key === 'Enter' && addAction()}
                  />
                  <Button size="sm" onClick={addAction}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formConfig.actions_list.map(action => (
                    <Badge key={action} variant="secondary" className="flex items-center gap-1">
                      {action}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeAction(action)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Catégories disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nouvelle catégorie..."
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <Button size="sm" onClick={addCategory}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formConfig.categories_list.map(category => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCategory(category)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Objets disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newObject}
                    onChange={(e) => setNewObject(e.target.value)}
                    placeholder="Nouvel objet..."
                    onKeyDown={(e) => e.key === 'Enter' && addObject()}
                  />
                  <Button size="sm" onClick={addObject}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formConfig.objects_list.map(object => (
                    <Badge key={object} variant="secondary" className="flex items-center gap-1">
                      {object}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeObject(object)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}