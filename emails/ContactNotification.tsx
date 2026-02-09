import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
} from '@react-email/components';
import * as styles from './styles';

interface ContactNotificationProps {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
}

const labelStyle = {
  color: '#2d3748',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '8px 0 4px 0',
};

const valueStyle = {
  color: '#4a5568',
  fontSize: '15px',
  margin: '0 0 16px 0',
  padding: '12px',
  backgroundColor: '#f7fafc',
  borderRadius: '4px',
  borderLeft: '3px solid #d4af37', // Gold accent
};

const inquiryTypeBadge = {
  display: 'inline-block',
  padding: '6px 12px',
  backgroundColor: '#d4af37',
  color: '#1e3a5f',
  borderRadius: '4px',
  fontSize: '13px',
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export default function ContactNotification({
  name,
  email,
  phone,
  inquiryType,
  message,
}: ContactNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>
            🎵 New Contact Form Submission
          </Heading>

          <Section>
            <Text style={labelStyle}>Inquiry Type:</Text>
            <span style={inquiryTypeBadge}>{inquiryType}</span>
          </Section>

          <Hr style={{ ...styles.hr, margin: '24px 0 16px 0' }} />

          <Section>
            <Text style={labelStyle}>Name:</Text>
            <Text style={valueStyle}>{name}</Text>

            <Text style={labelStyle}>Email:</Text>
            <Text style={valueStyle}>{email}</Text>

            <Text style={labelStyle}>Phone:</Text>
            <Text style={valueStyle}>{phone}</Text>

            <Text style={labelStyle}>Message:</Text>
            <Text style={valueStyle}>{message}</Text>
          </Section>

          <Hr style={styles.hr} />

          <Text style={{ ...styles.footer, fontSize: '13px' }}>
            Submitted on {new Date().toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
