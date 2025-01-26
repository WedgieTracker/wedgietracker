import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Row,
  Column,
  Img,
} from "@react-email/components";

interface OrderConfirmationEmailProps {
  orderNumber: number;
  size: string;
  color: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  amount: number;
  foldedImageUrl: string;
  stripeSessionId: string;
}

export default function OrderConfirmationEmail({
  orderNumber,
  size,
  color,
  customerName,
  customerEmail,
  shippingAddress,
  amount: _amount,
  foldedImageUrl,
  stripeSessionId,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your Wedgie T-Shirt Order Confirmation #
        {orderNumber.toString().padStart(3, "0")}
      </Preview>
      <Body style={main}>
        <Container style={{ textAlign: "center" }}>
          <Section>
            <Img
              src={foldedImageUrl}
              alt={`${color} T-shirt`}
              width={300}
              height={300}
              style={image}
            />
          </Section>
          <Section>
            <Text style={heading}>OG Wedgie T-Shirt</Text>
          </Section>

          <Section>
            <Text style={paragraph}>Hi {customerName},</Text>
            <Text style={{ ...paragraph, marginBottom: "20px" }}>
              Thank you for your order! We&apos;re excited to create your unique
              Wedgie T-Shirt.
            </Text>
          </Section>

          <Section style={orderDetails}>
            <Text style={subheading}>Order Details</Text>
            <Row style={{ marginBottom: "0" }}>
              <Column>
                <Text style={{ marginBottom: "0px" }}>
                  <span>
                    <span style={label}>Size</span>
                    <span style={value}>{size}</span>
                  </span>
                  <span style={{ marginLeft: "10px" }}>
                    <span style={label}>Color</span>
                    <span style={value}>{color}</span>
                  </span>
                </Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text
                  style={{
                    ...label,
                    marginTop: "10px",
                    marginBottom: "5px",
                    color: "#ebff00",
                  }}
                >
                  Your Unique Number
                </Text>
                <Text style={{ marginTop: "0px", marginBottom: "20px" }}>
                  <span style={uniqueNumber}>
                    #{orderNumber.toString().padStart(3, "0")}
                  </span>
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={orderDetails}>
            <Text style={subheading}>Shipping Address</Text>
            <Text style={address}>
              {customerName}
              <br />
              {shippingAddress.line1}
              {shippingAddress.line2 && (
                <>
                  <br />
                  {shippingAddress.line2}
                </>
              )}
              <br />
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
            </Text>

            <Text style={label}>Email</Text>
            <Text
              style={{
                ...value,
                fontSize: "14px",
                padding: "0px 10px",
                lineHeight: "1.2",
                border: "none",
                backgroundColor: "transparent",
                display: "block",
                margin: "0px",
                marginBottom: "20px",
              }}
            >
              <Link
                href={`mailto:${customerEmail}`}
                style={{ color: "#ebff00" }}
              >
                {customerEmail}
              </Link>
            </Text>
          </Section>

          <Section>
            <Text style={label}>Order ID</Text>
            <Text
              style={{
                ...value,
                fontSize: "12px",
                padding: "0px 20px",
                lineHeight: "1.2",
                border: "none",
                backgroundColor: "transparent",
                display: "inline-block",
                margin: "0 auto",
                maxWidth: "300px",
                overflowWrap: "break-word",
                marginBottom: "30px",
              }}
            >
              {stripeSessionId}
            </Text>
            <Text style={paragraph}>
              We&apos;ll notify you once your order has been shipped. If you
              have any questions, please don&apos;t hesitate to reach out at{" "}
              <Link
                href={`mailto:yo@wedgietracker.com`}
                style={{ color: "#ebff00" }}
              >
                yo@wedgietracker.com
              </Link>
              .
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
  borderRadius: "12px",
  overflow: "hidden",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#ebff00",
  textAlign: "center" as const,
  marginBottom: "0px",
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

const address = {
  fontSize: "16px",
  color: "#ffffff",
  lineHeight: "1.4",
};

const uniqueNumber = {
  backgroundColor: "#ebff00",
  color: "#17002d",
  padding: "4px 8px",
  borderRadius: "8px",
  fontWeight: "700",
  fontSize: "20px",
  display: "inline-block",
};
