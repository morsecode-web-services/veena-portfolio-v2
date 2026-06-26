import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components';
import * as styles from './styles';

interface CollaborationInquiryProps {
  name: string;
}

export default function CollaborationInquiry({ name }: CollaborationInquiryProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Dear {name},</Heading>

          <Text style={styles.text}>
            Thank you for reaching out about a potential collaboration. I&apos;m always excited to
            explore creative partnerships.
          </Text>

          <Text style={styles.text}>
            I will review your proposal and respond within 24-48 hours to discuss possibilities.
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>Looking forward to connecting,</Text>
          <Text style={styles.signature}>Aishwarya Manikarnike</Text>
        </Container>
      </Body>
    </Html>
  );
}
