import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from '@react-email/components';
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
          <Heading style={styles.heading}>Dear {name},</Heading>

          <Text style={styles.text}>
            Thank you for your message. I appreciate you taking the time to reach out.
          </Text>

          <Text style={styles.text}>
            I will respond to your inquiry within 24-48 hours.
          </Text>

          <Hr style={styles.hr} />

          <Text style={styles.footer}>
            Best regards,
          </Text>
          <Text style={styles.signature}>
            Aishwarya Manikarnike
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
