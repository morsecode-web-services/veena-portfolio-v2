import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Section,
} from '@react-email/components';
import * as styles from './styles';

interface ReenrollInviteProps {
  name: string;
  cohortTitle: string;
  paymentLink: string;
  price: string;
}

export default function ReenrollInvite({ name, cohortTitle, paymentLink, price }: ReenrollInviteProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={{ padding: '20px 0' }}>
            <Heading style={styles.heading}>Your spot is waiting, {name}! 🎵</Heading>

            <Text style={styles.text}>
              It was wonderful having you in the previous batch! The new cohort, <strong>{cohortTitle}</strong>, is now open for enrollment, and we&apos;d love to have you back.
            </Text>

            <Text style={styles.text}>
              Since you&apos;re a returning student, your details are already pre-filled. You can secure your spot instantly using your personalized payment link below.
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '36px 0' }}>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Cohort Fee: {price}
              </div>
              <Button
                href={paymentLink}
                style={{
                  backgroundColor: '#1e3a5f',
                  color: '#ffffff',
                  padding: '16px 40px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
                }}
              >
                Enroll in {cohortTitle} →
              </Button>
            </Section>

            <Hr style={styles.hr} />

            <Section style={{ marginTop: '24px' }}>
              <Text style={{ ...styles.text, marginBottom: '4px', fontWeight: 'bold' }}>
                See you in the batch,
              </Text>
              <Text style={{ ...styles.text, marginTop: '0', color: '#d4af37', fontWeight: 'bold', fontSize: '18px' }}>
                Aishwarya Manikarnike
              </Text>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={{ textAlign: 'center' as const, padding: '10px 0' }}>
            <Text style={{ fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
              You are receiving this because you were part of a previous Veena/Vocal cohort.<br />
              If you&apos;d rather not receive invitations for future batches, simply ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
