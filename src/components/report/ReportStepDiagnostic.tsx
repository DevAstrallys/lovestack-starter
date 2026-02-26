import { AlertTriangle, HelpCircle, MessageSquare, ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TicketFormStep } from '@/components/tickets/TicketFormStep';
import { TaxAction, TaxCategory, TaxObject, TaxDetail } from '@/hooks/useTaxonomy';

const ICON_MAP: Record<string, React.ElementType> = {
  AlertTriangle, HelpCircle, MessageSquare, ShieldCheck,
};

const URGENCY_LEVELS = [
  { value: 4, label: 'Personnes', color: 'bg-destructive text-destructive-foreground' },
  { value: 3, label: 'Immeuble', color: 'bg-orange-500 text-white' },
  { value: 2, label: 'Moyen', color: 'bg-yellow-500 text-black' },
  { value: 1, label: 'Faible', color: 'bg-muted text-muted-foreground' },
];

export interface DiagnosticData {
  action_id: string;
  action_key: string;
  action_label: string;
  category_id: string;
  category_label: string;
  object_id: string;
  object_label: string;
  detail_id: string;
  detail_label: string;
  urgency: number;
  initiality: 'initial' | 'relance';
}

interface Props {
  data: DiagnosticData;
  onChange: (data: DiagnosticData) => void;
  actions: TaxAction[];
  getFilteredCategories: (actionId: string) => TaxCategory[];
  getFilteredObjects: (categoryId: string) => Array<TaxObject | { id: string; label: string; isCustom?: true }>;
  getFilteredDetails: (objectId: string) => TaxDetail[];
}

export function ReportStepDiagnostic({ data, onChange, actions, getFilteredCategories, getFilteredObjects, getFilteredDetails }: Props) {
  const set = (partial: Partial<DiagnosticData>) => onChange({ ...data, ...partial });

  // Deduplicate actions by key
  const uniqueActions = actions.filter((action, index, self) =>
    index === self.findIndex(a => a.key === action.key)
  );

  const filteredCategories = data.action_id ? getFilteredCategories(data.action_id) : [];
  const filteredObjects = data.category_id ? getFilteredObjects(data.category_id) : [];
  const filteredDetails = data.object_id ? getFilteredDetails(data.object_id) : [];

  const selectAction = (action: TaxAction) => {
    set({
      action_id: action.id,
      action_key: action.key,
      action_label: action.label,
      category_id: '', category_label: '',
      object_id: '', object_label: '',
      detail_id: '', detail_label: '',
    });
  };

  return (
    <TicketFormStep title="Étape 2 — Diagnostic">
      {/* Action selection */}
      <div className="space-y-2">
        <Label>Que souhaitez-vous faire ? *</Label>
        <div className="grid grid-cols-2 gap-3">
          {uniqueActions.map(action => {
            const Icon = ICON_MAP[action.icon || ''] || AlertTriangle;
            const isSelected = data.action_id === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => selectAction(action)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-h-[88px] active:scale-95 ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium text-center leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {action.label}
                </span>
                {action.description && (
                  <span className="text-xs text-muted-foreground text-center line-clamp-2">{action.description}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Initiality selector - right after action */}
      {data.action_id && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label>Initiative *</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['initial', 'relance'] as const).map(val => (
              <button
                key={val}
                type="button"
                onClick={() => set({ initiality: val })}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all active:scale-95 min-h-[44px] ${
                  data.initiality === val
                    ? 'border-primary shadow-md ring-2 ring-primary/30 bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {val === 'initial' ? 'Initial' : 'Relance'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cascade: Category */}
      {data.action_id && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label>Catégorie *</Label>
          <Select
            value={data.category_id}
            onValueChange={v => {
              const cat = filteredCategories.find(c => c.id === v);
              set({ category_id: v, category_label: cat?.label || '', object_id: '', object_label: '', detail_id: '', detail_label: '' });
            }}
          >
            <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
            <SelectContent>
              {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cascade: Object */}
      {data.category_id && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label>Objet *</Label>
          <Select
            value={data.object_id}
            onValueChange={v => {
              const obj = filteredObjects.find(o => o.id === v);
              const defaultUrgency = obj && 'urgency_level' in obj && obj.urgency_level ? obj.urgency_level : data.urgency;
              set({ object_id: v, object_label: obj?.label || '', detail_id: '', detail_label: '', urgency: defaultUrgency });
            }}
          >
            <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Choisir un objet" /></SelectTrigger>
            <SelectContent>
              {filteredObjects.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cascade: Detail */}
      {data.object_id && filteredDetails.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label>Nature / Détail</Label>
          <Select
            value={data.detail_id}
            onValueChange={v => {
              const det = filteredDetails.find(d => d.id === v);
              set({ detail_id: v, detail_label: det?.label || '' });
            }}
          >
            <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Préciser (optionnel)" /></SelectTrigger>
            <SelectContent>
              {filteredDetails.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Urgency */}
      {data.object_id && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label>Niveau d'urgence *</Label>
          <div className="grid grid-cols-2 gap-2">
            {URGENCY_LEVELS.map(u => (
              <button
                key={u.value}
                type="button"
                onClick={() => set({ urgency: u.value })}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all active:scale-95 min-h-[44px] ${
                  data.urgency === u.value
                    ? 'border-primary shadow-md ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <Badge className={`${u.color} text-xs`}>{u.label}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auto title preview */}
      {data.action_label && data.category_label && data.object_label && (
        <div className="space-y-1 p-3 bg-muted rounded-md animate-in fade-in duration-300">
          <Label className="text-xs text-muted-foreground">Titre final du ticket :</Label>
          <p className="text-sm font-mono">
            [{data.initiality === 'relance' ? 'RELANCE' : 'INITIAL'}] [{data.action_key.toUpperCase()}] {data.category_label} &gt; {data.object_label}
            {data.detail_label ? ` : ${data.detail_label}` : ''}
          </p>
        </div>
      )}
    </TicketFormStep>
  );
}
