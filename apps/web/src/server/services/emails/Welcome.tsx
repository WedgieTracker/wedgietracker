import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Section,
  Img,
} from "@react-email/components";
import { main, paragraph, orderDetails, subheading } from "./styles";

export default function WelcomeEmail() {
  return (
    <Html style={main}>
      <Head />
      <Preview>The morning after a wedgie, we&apos;ll fill you in.</Preview>
      <Body style={main}>
        <Container style={{ textAlign: "center" }}>
          <Section>
            <Img
              src={
                "https://media.wedgietracker.com/assets/logo-wedgietracker_rlzejd.png"
              }
              alt={`Logo WedgieTracker`}
              width={120}
              style={image}
            />
          </Section>

          <Section>
            <Text style={{ ...paragraph, marginBottom: "20px" }}>
              Thanks for subscribing!
            </Text>
          </Section>

          <Section style={orderDetails}>
            <Text style={subheading}>What you&apos;ll get</Text>
            <Text style={{ ...paragraph, marginBottom: "20px" }}>
              The morning after a wedgie, at 8am Eastern, a short recap of what
              got stuck, with the clips and the season so far.
              <br />
              No wedgie, no email.
            </Text>
          </Section>

          <Section>
            <Text style={paragraph}>
              Until then, catch up on{" "}
              <a href="https://www.wedgietracker.com" style={link}>
                wedgietracker.com
              </a>{" "}
              or get the{" "}
              <a href="https://www.wedgietracker.com/app" style={link}>
                iOS app
              </a>
              .
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

const image = {
  margin: "0 auto",
  borderRadius: "0",
  overflow: "hidden",
};

const link = {
  color: "#ebff00",
  textDecoration: "none",
};
