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

interface CohortWelcomeProps {
  name: string;
  inviteLink?: string;
  isReminder?: boolean;
}

export default function CohortWelcome({
  name,
  inviteLink,
  isReminder = false,
}: CohortWelcomeProps) {
  const hasLink = !!(inviteLink && inviteLink.trim().length > 0);

  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={{ padding: '20px 0' }}>
            <Heading style={styles.heading}>
              {isReminder
                ? `Join your cohort Telegram channel, ${name}! ⏳`
                : `Welcome to the Cohort, ${name}! 🎉`}
            </Heading>

            {isReminder ? (
              <Text style={styles.text}>
                This is a gentle reminder to join your private Telegram channel. We don&apos;t want
                you to miss out on any important updates, cohort materials, or session schedules!
              </Text>
            ) : (
              <Text style={styles.text}>
                Your payment has been confirmed — thank you for enrolling!
              </Text>
            )}

            {hasLink ? (
              <>
                <Text style={styles.text}>
                  {isReminder
                    ? `Click the button below to claim your access. Please note that this is a single-use link — it will expire after one use and is tied directly to your enrollment.`
                    : `Your exclusive access to the private Telegram channel is ready. Click the button below to join. This is a single-use link — it will expire after one use and is tied to your enrollment. Please do not share it.`}
                </Text>

                <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
                  <Button
                    href={inviteLink}
                    style={{
                      backgroundColor: '#1e3a5f',
                      color: '#ffffff',
                      padding: '14px 36px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Join Telegram Channel →
                  </Button>
                </Section>

                <Text style={{ ...styles.text, fontSize: '13px', color: '#718096' }}>
                  If the button above doesn&apos;t work, copy and paste this link into your browser:
                  <br />
                  <a href={inviteLink} style={styles.link}>
                    {inviteLink}
                  </a>
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.text}>
                  Your personal Telegram invite link is being prepared and will be sent to you in a
                  separate email within the next few minutes.
                </Text>
                <Text style={{ ...styles.text, fontSize: '13px', color: '#718096' }}>
                  If you do not receive it within 15 minutes, please reply to this email or contact
                  us at{' '}
                  <a href="mailto:official@aishwaryamanikarnike.com" style={styles.link}>
                    official@aishwaryamanikarnike.com
                  </a>
                </Text>
              </>
            )}

            <Hr style={styles.hr} />

            <Section style={{ marginTop: '24px' }}>
              <Text style={{ ...styles.text, marginBottom: '4px', fontWeight: 'bold' }}>
                See you inside,
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
                Artist &amp; Performer |{' '}
                <a href="https://aishwaryamanikarnike.com" style={styles.link}>
                  aishwaryamanikarnike.com
                </a>
              </Text>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={{ textAlign: 'center' as const, padding: '10px 0' }}>
            <Text style={{ fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
              You are receiving this because you enrolled in a cohort on aishwaryamanikarnike.com
              <br />
              ⚠️ Do not forward this email — the invite link is single-use and tied to your
              enrollment.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
