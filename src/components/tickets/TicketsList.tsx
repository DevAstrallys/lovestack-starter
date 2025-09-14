import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Pause,
  MessageSquare,
  Calendar,
  MapPin,
  Tag
} from 'lucide-react';
import { Ticket } from '@/hooks/useTickets';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '@/utils/ticketUtils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TicketsListProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  loading?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <AlertCircle className="h-4 w-4" />;
    case 'in_progress': return <Clock className="h-4 w-4" />;
    case 'waiting': return <Pause className="h-4 w-4" />;
    case 'resolved': return <CheckCircle className="h-4 w-4" />;
    case 'closed': return <CheckCircle className="h-4 w-4" />;
    case 'canceled': return <XCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800 border-red-200';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
    case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function TicketsList({ tickets, onTicketClick, loading }: TicketsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun ticket trouvé</h3>
        <p className="text-muted-foreground">
          Aucun ticket ne correspond aux critères de recherche actuels.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card 
          key={ticket.id} 
          className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
          style={{ borderLeftColor: ticket.priority === 'urgent' ? '#dc2626' : ticket.priority === 'high' ? '#ea580c' : '#6b7280' }}
          onClick={() => onTicketClick(ticket)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate mb-1">
                    {ticket.title}
                  </h3>
                  {ticket.description && (
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {ticket.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`h-6 text-xs ${getPriorityColor(ticket.priority || 'medium')}`}>
                    {TICKET_PRIORITIES[ticket.priority as keyof typeof TICKET_PRIORITIES] || 'Moyenne'}
                  </Badge>
                  <Badge className={`h-6 text-xs ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    <span className="ml-1">
                      {TICKET_STATUSES[ticket.status as keyof typeof TICKET_STATUSES]}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(ticket.last_interaction_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                  
                  {ticket.location && typeof ticket.location === 'object' && 'element_name' in ticket.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{String(ticket.location.element_name)}</span>
                    </div>
                  )}
                  
                  {(ticket.category_code || ticket.nature_code) && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      <span>
                        {ticket.category_code}
                        {ticket.category_code && ticket.nature_code && ' • '}
                        {ticket.nature_code}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {ticket.assigned_to && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>Assigné</span>
                    </div>
                  )}
                  
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <Badge variant="outline" className="h-5 text-xs">
                      📎 {ticket.attachments.length}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Reporter info */}
              {ticket.reporter_name && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Demandeur:</span> {ticket.reporter_name}
                  {ticket.reporter_email && ` (${ticket.reporter_email})`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}