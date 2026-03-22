import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle2, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { createLogger } from '@/lib/logger';
import { searchTicketByTrackingCode, fetchPublicActivities } from '@/services/tickets/tracking';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const log = createLogger('page:ticketTracking');

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Ouvert', variant: 'default' },
  in_progress: { label: 'En cours', variant: 'secondary' },
  waiting: { label: 'En attente', variant: 'outline' },
  resolved: { label: 'Résolu', variant: 'default' },
  closed: { label: 'Clôturé', variant: 'secondary' },
  canceled: { label: 'Annulé', variant: 'destructive' },
};

export function TicketTracking() {
  const { slug } = useParams();
  const [code, setCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const formatCode = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    if (clean.length > 4) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    return clean;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.replace('-', '').length < 8) return;
    setSearching(true);
    setSearched(true);
    try {
      const result = await searchTicketByTrackingCode(code);
      setTicket(result);
      if (result) {
        const acts = await fetchPublicActivities(result.id);
        setActivities(acts);
      } else {
        setActivities([]);
      }
    } catch (err) {
      log.error('Tracking search failed', { code, error: err });
      setTicket(null);
      setActivities([]);
    } finally {
      setSearching(false);
    }
  };

  const isResolved = ticket && (ticket.status === 'resolved' || ticket.status === 'closed');
  const statusInfo = ticket ? STATUS_MAP[ticket.status] || { label: ticket.status, variant: 'outline' as const } : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center text-foreground">Suivre ma demande</h1>
        <p className="text-center text-sm text-muted-foreground">Entrez votre code de suivi</p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <Label htmlFor="tracking-code">Code de suivi</Label>
            <Input
              id="tracking-code"
              value={code}
              onChange={e => setCode(formatCode(e.target.value))}
              placeholder="XXXX-XXXX"
              className="text-center text-lg font-mono tracking-widest"
              maxLength={9}
            />
          </div>
          <Button type="submit" className="w-full min-h-[44px]" disabled={searching || code.replace('-', '').length < 8}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Rechercher
          </Button>
        </form>

        {searched && !searching && !ticket && (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
              <p className="font-medium text-foreground">Aucun résultat</p>
              <p className="text-sm text-muted-foreground">Vérifiez votre code et réessayez.</p>
            </CardContent>
          </Card>
        )}

        {ticket && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Votre demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isResolved && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-medium">Votre demande a été traitée</p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant={statusInfo!.variant}>{statusInfo!.label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créé le</span>
                  <span className="text-foreground">{format(new Date(ticket.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière mise à jour</span>
                  <span className="text-foreground">{format(new Date(ticket.updated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
                </div>
              </div>

              {activities.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" /> Réponses
                  </p>
                  {activities.map(act => (
                    <div key={act.id} className="p-3 rounded-md bg-muted text-sm">
                      <p className="text-muted-foreground text-xs mb-1">
                        {format(new Date(act.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                      {act.content && <p className="text-foreground">{act.content}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {slug && (
          <Button variant="outline" className="w-full" onClick={() => window.location.href = `/ticket-form/${slug}`}>
            Nouvelle déclaration
          </Button>
        )}
      </div>
    </div>
  );
}
