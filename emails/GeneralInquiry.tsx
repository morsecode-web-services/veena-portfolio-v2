import { Html, Head, Body, Container, Heading, Text, Hr, Section } from '@react-email/components';
import * as styles from './styles';

interface GeneralInquiryProps {
  name: string;
}

export default function GeneralInquiry({ name }: GeneralInquiryProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={{ padding: '20px 0' }}>
            <Heading style={styles.heading}>Hi {name},</Heading>

            <Text style={styles.text}>
              Thank you so much for reaching out! This is an automated confirmation to let you know
              that I&apos;ve received your message.
            </Text>

            <Text style={styles.text}>
              I personally review every inquiry and will get back to you with a detailed response
              within **24-48 hours**.
            </Text>

            <Text style={styles.text}>
              In the meantime, feel free to explore more of my work or follow my journey on social
              media.
            </Text>

            <Hr style={styles.hr} />

            <Section style={{ marginTop: '24px' }}>
              <Text style={{ ...styles.text, marginBottom: '4px', fontWeight: 'bold' }}>
                Best regards,
              </Text>
              <Text
                style={{
                  ...styles.text,
                  marginTop: '0',
                  color: '#d4af37',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}
              >
                Aishwarya Manikarnike
              </Text>
              <Text style={{ ...styles.text, fontSize: '13px', color: '#666' }}>
                Artist & Performer |{' '}
                <a
                  href="https://aishwaryamanikarnike.com"
                  style={{ color: '#1e3a5f', textDecoration: 'underline' }}
                >
                  aishwaryamanikarnike.com
                </a>
              </Text>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={{ textAlign: 'center' as const, padding: '10px 0' }}>
            <Text style={{ fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
              You are receiving this because you submitted a form on aishwaryamanikarnike.com
              <br />
              Bengaluru, Karnataka, India
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
