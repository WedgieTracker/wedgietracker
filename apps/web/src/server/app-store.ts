import { X509Certificate, verify } from "node:crypto";
import { z } from "zod";
import { addSeasonCoffees } from "~/server/coffees";

/**
 * Apple Root CA - G3, from https://www.apple.com/certificateauthority/.
 * SHA-256 fingerprint 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79.
 */
export const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----
`;

export const APP_BUNDLE_ID = "com.wedgietracker.app";

/** Each coffee product and how many coffees it's worth. */
export const COFFEE_PRODUCTS: Readonly<Record<string, number>> = {
  "com.wedgietracker.app.coffee1": 1,
  "com.wedgietracker.app.coffee3": 3,
  "com.wedgietracker.app.coffee5": 5,
};

/** Apple puts these extensions on the certificates it signs purchases with. */
const LEAF_MARKER_OID = "1.2.840.113635.100.6.11.1";
const INTERMEDIATE_MARKER_OID = "1.2.840.113635.100.6.2.1";

/** The fields of a signed transaction this app reads. */
const transactionSchema = z.object({
  transactionId: z.string().min(1),
  bundleId: z.string(),
  productId: z.string(),
  type: z.string(),
  environment: z.string(),
  quantity: z.number().int(),
  signedDate: z.number().nullish(),
  revocationDate: z.number().nullish(),
});

export type AppStoreTransaction = z.infer<typeof transactionSchema>;

export class AppStoreVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppStoreVerificationError";
  }
}

function fail(message: string): never {
  throw new AppStoreVerificationError(message);
}

function decodeJson(part: string): unknown {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return fail("bad JSON in the JWS");
  }
}

/** The DER bytes of an OID, tag and length included. */
function encodeOid(oid: string): Buffer {
  const [first = 0, second = 0, ...rest] = oid.split(".").map(Number);
  const bytes = [first * 40 + second];
  for (const arc of rest) {
    const chunk = [arc & 0x7f];
    for (let n = arc >>> 7; n > 0; n >>>= 7) chunk.unshift((n & 0x7f) | 0x80);
    bytes.push(...chunk);
  }
  return Buffer.from([0x06, bytes.length, ...bytes]);
}

function hasOid(cert: X509Certificate, oid: string): boolean {
  return cert.raw.includes(encodeOid(oid));
}

function parseCert(base64: unknown): X509Certificate {
  if (typeof base64 !== "string") return fail("x5c entry isn't a string");
  try {
    return new X509Certificate(Buffer.from(base64, "base64"));
  } catch {
    return fail("x5c entry isn't a certificate");
  }
}

function isValidAt(cert: X509Certificate, at: Date): boolean {
  const from = new Date(cert.validFrom).getTime();
  const to = new Date(cert.validTo).getTime();
  return at.getTime() >= from && at.getTime() <= to;
}

/**
 * Checks a JWS that Apple signed for the App Store, a StoreKit 2 transaction
 * or a server notification, and returns its decoded payload. Throws
 * AppStoreVerificationError unless the JWS is ES256, signed by a leaf that
 * chains through an Apple intermediate to the trusted root. The root is the
 * Apple one unless a test passes its own.
 */
export function verifyAppleSignedPayload(
  jws: string,
  trustedRoot: string | Buffer = APPLE_ROOT_CA_G3_PEM,
): unknown {
  const parts = jws.split(".");
  if (parts.length !== 3) fail("not a compact JWS");
  const [headerPart = "", payloadPart = "", signaturePart = ""] = parts;

  const header = decodeJson(headerPart) as { alg?: unknown; x5c?: unknown };
  if (header.alg !== "ES256") fail("alg isn't ES256");
  if (!Array.isArray(header.x5c) || header.x5c.length !== 3) {
    fail("x5c isn't a chain of three");
  }
  const [leaf, intermediate, root] = header.x5c.map(parseCert);
  if (!leaf || !intermediate || !root) return fail("x5c isn't complete");

  const trusted = new X509Certificate(trustedRoot);
  if (!root.raw.equals(trusted.raw)) fail("root isn't the trusted root");

  if (!intermediate.checkIssued(root) || !intermediate.verify(root.publicKey)) {
    fail("intermediate isn't signed by the root");
  }
  if (!leaf.checkIssued(intermediate) || !leaf.verify(intermediate.publicKey)) {
    fail("leaf isn't signed by the intermediate");
  }
  if (!hasOid(intermediate, INTERMEDIATE_MARKER_OID)) {
    fail("intermediate isn't an Apple WWDR certificate");
  }
  if (!hasOid(leaf, LEAF_MARKER_OID)) {
    fail("leaf isn't an App Store receipt signing certificate");
  }

  const key = leaf.publicKey;
  if (
    key.asymmetricKeyType !== "ec" ||
    key.asymmetricKeyDetails?.namedCurve !== "prime256v1"
  ) {
    fail("leaf key isn't P-256");
  }
  const signature = Buffer.from(signaturePart, "base64url");
  const signed = verify(
    "sha256",
    Buffer.from(`${headerPart}.${payloadPart}`),
    { key, dsaEncoding: "ieee-p1363" },
    signature,
  );
  if (!signed) fail("bad signature");

  const payload = decodeJson(payloadPart);
  if (typeof payload !== "object" || payload === null) {
    fail("payload isn't an object");
  }

  // Apple checks the chain as of when the payload was signed, so an old
  // purchase still verifies after its certificate expires.
  const { signedDate } = payload as { signedDate?: unknown };
  const at = new Date(typeof signedDate === "number" ? signedDate : Date.now());
  for (const cert of [leaf, intermediate, root]) {
    if (!isValidAt(cert, at)) fail("certificate not valid at signedDate");
  }

  return payload;
}

/**
 * Checks a StoreKit 2 signed transaction (its jwsRepresentation) and returns
 * the transaction inside. Throws AppStoreVerificationError as
 * verifyAppleSignedPayload does, or if the payload isn't a transaction.
 */
export function verifyAppStoreTransaction(
  jws: string,
  trustedRoot: string | Buffer = APPLE_ROOT_CA_G3_PEM,
): AppStoreTransaction {
  const parsed = transactionSchema.safeParse(
    verifyAppleSignedPayload(jws, trustedRoot),
  );
  if (!parsed.success) fail("payload isn't a transaction");
  return parsed.data;
}

/** A coffee purchase's key in coffee_checkout. */
export function appStoreCoffeeKey(transaction: AppStoreTransaction): string {
  return `appstore:${transaction.transactionId}`;
}

/** How many coffees a product is worth, or undefined if it isn't a coffee. */
export function coffeesPerProduct(productId: string): number | undefined {
  return Object.hasOwn(COFFEE_PRODUCTS, productId)
    ? COFFEE_PRODUCTS[productId]
    : undefined;
}

export type AppStoreCoffeeResult =
  | { status: "counted"; coffees: number }
  | { status: "ignored"; reason: "sandbox" | "no-season" }
  | {
      status: "rejected";
      reason: "invalid" | "wrong-app" | "unknown-product" | "revoked";
    };

/**
 * Adds a coffee bought in the iOS app to the current season's total, once.
 * Only a verified, live App Store purchase counts: Sandbox and Xcode cover
 * TestFlight and the simulator, so those are thanked but never counted.
 */
export async function recordAppStoreCoffee(
  signedTransaction: string,
  trustedRoot: string | Buffer = APPLE_ROOT_CA_G3_PEM,
): Promise<AppStoreCoffeeResult> {
  let transaction: AppStoreTransaction;
  try {
    transaction = verifyAppStoreTransaction(signedTransaction, trustedRoot);
  } catch (error) {
    console.warn("App Store coffee not verified:", error);
    return { status: "rejected", reason: "invalid" };
  }

  if (transaction.bundleId !== APP_BUNDLE_ID) {
    return { status: "rejected", reason: "wrong-app" };
  }
  if (transaction.environment !== "Production") {
    return { status: "ignored", reason: "sandbox" };
  }
  const perProduct = coffeesPerProduct(transaction.productId);
  if (!perProduct || transaction.type !== "Consumable") {
    return { status: "rejected", reason: "unknown-product" };
  }
  if (transaction.revocationDate != null) {
    return { status: "rejected", reason: "revoked" };
  }
  if (transaction.quantity < 1) {
    return { status: "rejected", reason: "invalid" };
  }

  const coffees = perProduct * transaction.quantity;
  const added = await addSeasonCoffees(appStoreCoffeeKey(transaction), coffees);
  if (added === "no-season") return { status: "ignored", reason: "no-season" };
  return { status: "counted", coffees };
}
