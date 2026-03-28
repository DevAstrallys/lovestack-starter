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

interface WelcomeEmailProps {
  name: string;
  organizationName?: string;
  loginUrl?: string;
  email?: string;
  password?: string;
}

export const WelcomeEmail = ({
  name,
  organizationName = "votre organisation",
  loginUrl = "#",
  email,
  password,
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

        {(email || password) && (
          <Section style={credentialsBox}>
            <Text style={credentialsTitle}>Vos identifiants de connexion</Text>
            {email && (
              <Text style={credentialLine}>
                <strong>Email :</strong> {email}
              </Text>
            )}
            {password && (
              <Text style={credentialLine}>
                <strong>Mot de passe temporaire :</strong> {password}
              </Text>
            )}
            <Text style={warningText}>
              ⚠️ Nous vous recommandons de changer votre mot de passe dès votre première connexion.
            </Text>
          </Section>
        )}

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

const credentialsBox = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
  border: '1px solid #e4e4e7',
};

const credentialsTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px',
};

const credentialLine = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '4px 0',
  fontFamily: 'monospace',
};

const warningText = {
  color: '#b45309',
  fontSize: '13px',
  lineHeight: '20px',
  marginTop: '12px',
  marginBottom: '0',
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
