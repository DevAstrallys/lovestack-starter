import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface TicketEmailProps {
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  assignedTo?: string;
  description?: string;
  ticketUrl?: string;
  organizationName?: string;
}

export const TicketEmail = ({
  ticketNumber,
  title,
  status,
  priority,
  assignedTo,
  description,
  ticketUrl,
  organizationName = "Votre App"
}: TicketEmailProps) => {
  const statusColors = {
    'open': '#f59e0b',
    'in_progress': '#3b82f6',
    'resolved': '#10b981',
    'closed': '#6b7280'
  };

  const priorityColors = {
    'low': '#10b981',
    'medium': '#3b82f6',
    'high': '#f59e0b', 
    'urgent': '#ef4444'
  };

  return (
    <Html>
      <Head />
      <Preview>Ticket #{ticketNumber} - {status}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Ticket #{ticketNumber}</Heading>
          
          <Section style={detailsContainer}>
            <Text style={detailRow}>
              <strong>Titre:</strong> {title}
            </Text>
            <Text style={detailRow}>
              <strong>Statut:</strong> 
              <span style={{
                ...statusBadge,
                backgroundColor: statusColors[status] || '#6b7280'
              }}>
                {status}
              </span>
            </Text>
            <Text style={detailRow}>
              <strong>Priorité:</strong>
              <span style={{
                ...priorityBadge,
                backgroundColor: priorityColors[priority] || '#6b7280'
              }}>
                {priority}
              </span>
            </Text>
            {assignedTo && (
              <Text style={detailRow}>
                <strong>Assigné à:</strong> {assignedTo}
              </Text>
            )}
          </Section>

          {description && (
            <>
              <Hr style={hr} />
              <Section>
                <Text style={sectionTitle}>Description:</Text>
                <Text style={description}>
                  {description}
                </Text>
              </Section>
            </>
          )}

          {ticketUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={ticketUrl}>
                Voir le ticket
              </Button>
            </Section>
          )}
          
          <Text style={footer}>
            Cette notification a été envoyée par {organizationName}.<br />
            Vous recevez cet email car vous êtes impliqué dans ce ticket.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px 0',
  padding: '0',
};

const detailsContainer = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const detailRow = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const statusBadge = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  marginLeft: '8px',
};

const priorityBadge = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  marginLeft: '8px',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '20px 0',
};

const sectionTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '16px 0 8px 0',
};

const description = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '18px',
  marginTop: '32px',
  borderTop: '1px solid #eaeaea',
  paddingTop: '16px',
};