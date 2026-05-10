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
  formData?: Record<string, any>;
  formFields?: any[];
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
  formData,
  formFields,
}: ContactNotificationProps) {
  // If we have dynamic form data, we want to prioritize it
  // but keep the standard fields as a fallback/header
  const isDynamicForm = !!formData;

  // Filter out fields we already show at the top (name, email, phone, message)
  // to avoid duplication, while ensuring we show EVERYTHING else
  const processedFields = isDynamicForm ? Object.entries(formData).filter(([key]) => {
    const skipKeys = ['name', 'email', 'phone', 'message', 'inquiryType', 'formSlug'];
    return !skipKeys.includes(key);
  }) : [];

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

            {email && (
              <>
                <Text style={labelStyle}>Email:</Text>
                <Text style={valueStyle}>{email}</Text>
              </>
            )}

            {phone && (
              <>
                <Text style={labelStyle}>Phone:</Text>
                <Text style={valueStyle}>{phone}</Text>
              </>
            )}

            {/* Render all other dynamic fields */}
            {processedFields.map(([key, value]) => {
              // Try to find a human-readable label from formFields metadata
              const fieldMeta = formFields?.find(f => f.name === key);
              const label = fieldMeta?.label || key;
              
              // Skip empty values
              if (value === null || value === undefined || value === '') return null;

              return (
                <div key={key}>
                  <Text style={labelStyle}>{label}:</Text>
                  {typeof value === 'string' && value.startsWith('http') && (value.includes('cloudinary') || value.includes('res.cloudinary')) ? (
                    <div style={{ margin: '0 0 16px 0', padding: '12px', backgroundColor: '#f7fafc', borderRadius: '4px', borderLeft: '3px solid #d4af37' }}>
                      <a href={value} style={{ color: '#d4af37', textDecoration: 'underline', fontSize: '15px' }}>View Uploaded Image</a>
                    </div>
                  ) : (
                    <Text style={valueStyle}>{String(value)}</Text>
                  )}
                </div>
              );
            })}

            {message && message !== 'No message provided' && (
              <>
                <Text style={labelStyle}>Message:</Text>
                <Text style={valueStyle}>{message}</Text>
              </>
            )}
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
