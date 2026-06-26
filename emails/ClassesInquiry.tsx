import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components';
import * as styles from './styles';

interface ClassesInquiryProps {
  name: string;
}

export default function ClassesInquiry({ name }: ClassesInquiryProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Dear {name},</Heading>

          <Text style={styles.text}>
            Thank you for your interest in private classes! I&apos;m delighted to hear from you.
          </Text>

          <Text style={styles.text}>I offer personalized instruction in:</Text>

          <ul style={styles.list}>
            <li style={styles.listItem}>Saraswati Veena (Carnatic style)</li>
            <li style={styles.listItem}>Carnatic Vocal Music</li>
            <li style={styles.listItem}>Music Theory & Composition</li>
          </ul>

          <Text style={styles.text}>
            I will reach out within 24-48 hours to discuss your goals, schedule, and get started on
            your musical journey.
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>Warm regards,</Text>
          <Text style={styles.signature}>Aishwarya Manikarnike</Text>
        </Container>
      </Body>
    </Html>
  );
}
