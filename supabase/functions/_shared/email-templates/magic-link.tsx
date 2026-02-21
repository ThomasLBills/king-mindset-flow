/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for Liberated Kings</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome back, King.</Heading>
        <Text style={text}>
          Use the link below to sign in. It will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Sign In
        </Button>
        <Hr style={divider} />
        <Text style={footer}>
          If you did not request this link, you can safely disregard this message.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const button = {
  backgroundColor: '#C9A84C',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const divider = { borderColor: 'rgba(201,168,76,0.2)', margin: '32px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' }
