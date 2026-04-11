import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';
import { updateQRCode } from '@/services/locations';
import { fetchTaxActions, fetchTaxCategories } from '@/services/tickets/taxonomy';
import type { QRCode } from '@/types';

const log = createLogger('component:QRCodeFormConfig');

interface QRCodeFormConfigProps {
  qrCode: QRCode;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface FormConfigData {
  allowed_action_ids: string[];
  allowed_category_ids: string[];
  default_action_id: string;
  default_urgency: number;
}

interface TaxAction {
  id: string; key: string; label: string; icon?: string | null; color?: string | null; description?: string | null;
}
interface TaxCategory {
  id: string; key: string; label: string; action_id: string;
}

const URGENCY_OPTIONS = [
  { value: 1, label: '1 — Faible (< 7 jours)', dot: '🟢' },
  { value: 2, label: '2 — Moyen (< 72h)', dot: '🟡' },
  { value: 3, label: '3 — Immeuble (< 24h)', dot: '🟠' },
  { value: 4, label: '4 — Personnes (< 1h)', dot: '🔴' },
];

function parseFormConfig(raw: unknown): FormConfigData {
  const defaults: FormConfigData = {
    allowed_action_ids: [],
    allowed_category_ids: [],
    default_action_id: '',
    default_urgency: 0,
  };
  if (!raw || typeof raw !== 'object') return defaults;
  const obj = raw as Record<string, unknown>;
  return {
    allowed_action_ids: Array.isArray(obj.allowed_action_ids) ? obj.allowed_action_ids : [],
    allowed_category_ids: Array.isArray(obj.allowed_category_ids) ? obj.allowed_category_ids : [],
    default_action_id: typeof obj.default_action_id === 'string' ? obj.default_action_id : '',
    default_urgency: typeof obj.default_urgency === 'number' ? obj.default_urgency : 0,
  };
}

export function QRCodeFormConfig({ qrCode, isOpen, onClose, onUpdate }: QRCodeFormConfigProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<TaxAction[]>([]);
  const [allCategories, setAllCategories] = useState<TaxCategory[]>([]);
  const [config, setConfig] = useState<FormConfigData>(() => parseFormConfig(qrCode?.form_config));

  // Load taxonomy data
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const acts = await fetchTaxActions();
        setActions(acts);
        // Load categories for all actions
        const catPromises = acts.map(a => fetchTaxCategories(a.id));
        const catResults = await Promise.all(catPromises);
        setAllCategories(catResults.flat());
      } catch (err) {
        log.error('Failed to load taxonomy', { error: err });
      }
    })();
  }, [isOpen]);

  // Reset config when qrCode changes
  useEffect(() => {
    setConfig(parseFormConfig(qrCode?.form_config));
  }, [qrCode?.id]);

  const toggleActionId = (id: string) => {
    setConfig(prev => {
      const next = prev.allowed_action_ids.includes(id)
        ? prev.allowed_action_ids.filter(x => x !== id)
        : [...prev.allowed_action_ids, id];
      // Clean up categories that no longer belong to allowed actions
      const validCats = next.length > 0
        ? prev.allowed_category_ids.filter(cid => {
            const cat = allCategories.find(c => c.id === cid);
            return cat && next.includes(cat.action_id);
          })
        : prev.allowed_category_ids;
      // Clean default_action_id if removed
      const defaultAction = next.length > 0 && !next.includes(prev.default_action_id)
        ? '' : prev.default_action_id;
      return { ...prev, allowed_action_ids: next, allowed_category_ids: validCats, default_action_id: defaultAction };
    });
  };

  const toggleCategoryId = (id: string) => {
    setConfig(prev => ({
      ...prev,
      allowed_category_ids: prev.allowed_category_ids.includes(id)
        ? prev.allowed_category_ids.filter(x => x !== id)
        : [...prev.allowed_category_ids, id],
    }));
  };

  // Filtered categories: only those belonging to allowed actions (or all if no filter)
  const visibleCategories = config.allowed_action_ids.length > 0
    ? allCategories.filter(c => config.allowed_action_ids.includes(c.action_id))
    : allCategories;

  const handleSave = async () => {
    try {
      setLoading(true);
      // Build clean config — only include non-empty values
      const cleanConfig: Record<string, unknown> = {};
      if (config.allowed_action_ids.length > 0) cleanConfig.allowed_action_ids = config.allowed_action_ids;
      if (config.allowed_category_ids.length > 0) cleanConfig.allowed_category_ids = config.allowed_category_ids;
      if (config.default_action_id) cleanConfig.default_action_id = config.default_action_id;
      if (config.default_urgency > 0) cleanConfig.default_urgency = config.default_urgency;

      await updateQRCode(qrCode.id, { form_config: cleanConfig });

      toast({ title: 'Configuration sauvegardée', description: 'La configuration du formulaire a été mise à jour' });
      onUpdate();
      onClose();
    } catch (err) {
      log.error('Error saving form config', { error: err });
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder la configuration', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration du formulaire
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions multiselect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions autorisées</CardTitle>
              <p className="text-sm text-muted-foreground">
                Si vide, toutes les actions seront disponibles dans le formulaire.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {actions.map(action => (
                  <label key={action.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={config.allowed_action_ids.includes(action.id)}
                      onCheckedChange={() => toggleActionId(action.id)}
                    />
                    <span className="text-sm">{action.label}</span>
                  </label>
                ))}
              </div>
              {config.allowed_action_ids.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {config.allowed_action_ids.map(id => {
                    const a = actions.find(x => x.id === id);
                    return a ? (
                      <Badge key={id} variant="secondary" className="flex items-center gap-1">
                        {a.label}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleActionId(id)} />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories multiselect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catégories autorisées</CardTitle>
              <p className="text-sm text-muted-foreground">
                Si vide, toutes les catégories seront disponibles.
              </p>
            </CardHeader>
            <CardContent>
              {visibleCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune catégorie disponible</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {visibleCategories.map(cat => {
                    const parentAction = actions.find(a => a.id === cat.action_id);
                    return (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={config.allowed_category_ids.includes(cat.id)}
                          onCheckedChange={() => toggleCategoryId(cat.id)}
                        />
                        <span className="text-sm">
                          {cat.label}
                          {parentAction && <span className="text-muted-foreground ml-1">({parentAction.label})</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valeurs par défaut</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action par défaut</Label>
                <Select
                  value={config.default_action_id || '__none__'}
                  onValueChange={v => setConfig(prev => ({ ...prev, default_action_id: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune présélection</SelectItem>
                    {(config.allowed_action_ids.length > 0
                      ? actions.filter(a => config.allowed_action_ids.includes(a.id))
                      : actions
                    ).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgence par défaut</Label>
                <Select
                  value={config.default_urgency > 0 ? String(config.default_urgency) : '__none__'}
                  onValueChange={v => setConfig(prev => ({ ...prev, default_urgency: v === '__none__' ? 0 : Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune présélection</SelectItem>
                    {URGENCY_OPTIONS.map(u => (
                      <SelectItem key={u.value} value={String(u.value)}>
                        {u.dot} {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
