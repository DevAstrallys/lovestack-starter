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

interface WelcomeEmailProps {
  name: string;
  organizationName?: string;
  loginUrl?: string;
}

export const WelcomeEmail = ({
  name,
  organizationName = "votre organisation",
  loginUrl = "#"
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenue dans {organizationName} !</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bienvenue {name} !</Heading>
        
        <Text style={text}>
          Nous sommes ravis de vous accueillir dans <strong>{organizationName}</strong>.
        </Text>
        
        <Text style={text}>
          Votre compte a été créé avec succès. Vous pouvez maintenant accéder à tous les services 
          et fonctionnalités de notre plateforme.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Accéder à la plateforme
          </Button>
        </Section>
        
        <Text style={text}>
          Si vous avez des questions, n'hésitez pas à nous contacter.
        </Text>
        
        <Text style={footer}>
          Cordialement,<br />
          L'équipe {organizationName}
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

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
  margin: '40px 0',
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
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
};