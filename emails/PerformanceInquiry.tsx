import { Html, Head, Body, Container, Heading, Text, Link, Hr } from '@react-email/components';
import * as styles from './styles';

interface PerformanceInquiryProps {
  name: string;
}

export default function PerformanceInquiry({ name }: PerformanceInquiryProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Dear {name},</Heading>

          <Text style={styles.text}>
            Thank you for your interest in booking a performance. I&apos;m honored by your inquiry.
          </Text>

          <Text style={styles.text}>
            I will review your message and respond within 24-48 hours with my availability and
            details.
          </Text>

          <Text style={styles.text}>
            In the meantime, feel free to explore my recent performances and repertoire at{' '}
            <Link href="https://aishwaryamanikarnike.com" style={styles.link}>
              aishwaryamanikarnike.com
            </Link>
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>Warm regards,</Text>
          <Text style={styles.signature}>Aishwarya Manikarnike</Text>
          <Text style={styles.title}>
            &apos;A&apos;-Grade Veena Artist (AIR) | Vidwat Antima Rank-Holding Vocalist
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
