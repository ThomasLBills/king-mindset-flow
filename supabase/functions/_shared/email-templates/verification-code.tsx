/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface VerificationCodeEmailProps {
  code: string
}

export const VerificationCodeEmail = ({ code }: VerificationCodeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Liberated Kings verification code: {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Liberated Kings</Heading>
        <Text style={text}>
          Go to <strong>app.liberatedkings.com</strong> and click "New here? Set up your account" to create your account using the code below:
        </Text>
        <div style={codeContainer}>
          <Text style={codeStyle}>{code}</Text>
        </div>
        <Text style={text}>
          This code expires in 24 hours.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>
          If you were not expecting this, you can safely disregard this message.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default VerificationCodeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const h1 = {
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: '26px',
  fontWeight: '600' as const,
  color: '#1A1A1A',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#555555',
  lineHeight: '1.6',
  margin: '0 0 28px',
}
const codeContainer = {
  backgroundColor: '#F9F5EB',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 28px',
  border: '1px solid rgba(201,168,76,0.3)',
}
const codeStyle = {
  fontSize: '36px',
  fontWeight: '700' as const,
  color: '#1A1A1A',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: "'Inter', Arial, sans-serif",
}
const divider = { borderColor: 'rgba(201,168,76,0.2)', margin: '32px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' }
