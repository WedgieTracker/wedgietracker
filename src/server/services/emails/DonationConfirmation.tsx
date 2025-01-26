import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Section,
  Row,
  Column,
  Img,
} from "@react-email/components";

interface DonationConfirmationEmailProps {
  customerName: string;
  amount: number;
}

export default function DonationConfirmationEmail({
  customerName,
  amount,
}: DonationConfirmationEmailProps) {
  return (
    <Html style={main}>
      <Head />
      <Preview>Thank you for your donation!</Preview>
      <Body style={main}>
        <Container style={{ textAlign: "center" }}>
          <Section>
            <Img
              src={
                "https://res.cloudinary.com/wedgietracker/image/upload/v1737299676/assets/logo-wedgietracker_rlzejd.png"
              }
              alt={`Logo WedgieTracker`}
              width={120}
              style={image}
            />
          </Section>

          <Section>
            <Text style={paragraph}>Hi {customerName},</Text>
            <Text style={{ ...paragraph, marginBottom: "20px" }}>
              Thank you for your donation!
            </Text>
          </Section>

          <Section style={orderDetails}>
            <Text style={subheading}>Donation Details</Text>
            <Row style={{ marginBottom: "0" }}>
              <Column>
                <Text style={{ marginBottom: "20px" }}>
                  <span>
                    <span style={label}>Amount</span>
                    <span style={value}>${amount}</span>
                  </span>
                </Text>
              </Column>
            </Row>
          </Section>

          <Section>
            <Text style={paragraph}>
              Your donation helps us keep WedgieTracker running and improving.
              <br />
              <br />
              If you have any questions, please don&apos;t hesitate to reach out
              to us at{" "}
              <a href="mailto:yo@wedgietracker.com" style={link}>
                yo@wedgietracker.com
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#17002d",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const image = {
  margin: "0 auto",
  //   marginBottom: "16px",
  borderRadius: "0",
  overflow: "hidden",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#ffffff",
  marginBottom: "0px",
};

const orderDetails = {
  padding: "16",
  backgroundColor: "#130135",
  borderRadius: "12px",
  marginBottom: "16px",
};

const subheading = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#ebff00",
  marginBottom: "0px",
};

const label = {
  fontSize: "14px",
  color: "rgba(255, 255, 255, 0.6)",
  marginBottom: "0px",
};

const value = {
  fontSize: "16px",
  color: "#ffffff",
  fontWeight: "500",
  padding: "1px 4px",
  borderRadius: "4px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  margin: "0px",
  marginLeft: "4px",
  border: "1px solid rgba(255, 255, 255, 1)",
};

const link = {
  color: "#ebff00",
  textDecoration: "none",
};
