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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface NotificationEmailProps {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  organizationName?: string;
}

export const NotificationEmail = ({
  title,
  message,
  actionUrl,
  actionText = "Voir les détails",
  priority = 'medium',
  organizationName = "Votre App"
}: NotificationEmailProps) => {
  const priorityColors = {
    low: '#10b981',
    medium: '#3b82f6', 
    high: '#f59e0b',
    urgent: '#ef4444'
  };

  const priorityLabels = {
    low: 'Faible',
    medium: 'Normale',
    high: 'Importante',
    urgent: 'Urgente'
  };

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={priorityBadgeContainer}>
            <Text style={{
              ...priorityBadge,
              backgroundColor: priorityColors[priority]
            }}>
              Priorité {priorityLabels[priority]}
            </Text>
          </Section>
          
          <Heading style={h1}>{title}</Heading>
          
          <Text style={text}>
            {message}
          </Text>

          {actionUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={actionUrl}>
                {actionText}
              </Button>
            </Section>
          )}
          
          <Text style={footer}>
            Cette notification a été envoyée par {organizationName}.<br />
            Si vous ne souhaitez plus recevoir ces notifications, vous pouvez modifier vos préférences dans votre profil.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NotificationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const priorityBadgeContainer = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const priorityBadge = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
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