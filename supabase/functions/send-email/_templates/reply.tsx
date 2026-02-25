import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ReplyEmailProps {
  ticketTitle: string;
  replyContent: string;
  replierName: string;
  ticketId: string;
}

export const ReplyEmail = ({
  ticketTitle,
  replyContent,
  replierName,
  ticketId,
}: ReplyEmailProps) => (
  <Html>
    <Head />
    <Preview>Réponse à votre demande : {ticketTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Réponse à votre demande</Heading>
        <Text style={text}>
          <strong>{replierName}</strong> a répondu à votre demande :
        </Text>
        <Text style={{ ...text, fontWeight: 'bold' }}>{ticketTitle}</Text>
        <Hr style={hr} />
        <Text style={{ ...text, whiteSpace: 'pre-wrap' }}>{replyContent}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Vous pouvez répondre directement à cet email pour ajouter un commentaire au ticket.
        </Text>
        <Text style={{ ...footer, fontSize: '10px', color: '#aaa' }}>
          Ref: [ticket:{ticketId}]
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReplyEmail

const main = { backgroundColor: '#ffffff' }
const container = { paddingLeft: '12px', paddingRight: '12px', margin: '0 auto' }
const h1 = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '40px 0 20px',
}
const text = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  fontSize: '14px',
  margin: '16px 0',
}
const hr = { borderColor: '#e6ebf1', margin: '20px 0' }
const footer = {
  color: '#898989',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  fontSize: '12px',
  marginTop: '12px',
}
