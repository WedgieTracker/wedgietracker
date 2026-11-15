import { z } from "zod";
import {
  APP_BUNDLE_ID,
  APPLE_ROOT_CA_G3_PEM,
  appStoreCoffeeKey,
  coffeesPerProduct,
  verifyAppleSignedPayload,
  verifyAppStoreTransaction,
  type AppStoreTransaction,
} from "~/server/app-store";
import {
  refundSeasonCoffees,
  restoreSeasonCoffees,
  type CoffeeRefundResult,
} from "~/server/coffees";

/** The fields of an App Store Server Notification V2 this app reads. */
const notificationSchema = z.object({
  notificationType: z.string().min(1),
  subtype: z.string().nullish(),
  notificationUUID: z.string().nullish(),
  signedDate: z.number().nullish(),
  data: z
    .object({
      bundleId: z.string().nullish(),
      environment: z.string().nullish(),
      signedTransactionInfo: z.string().nullish(),
    })
    .nullish(),
  summary: z
    .object({
      bundleId: z.string().nullish(),
      environment: z.string().nullish(),
    })
    .nullish(),
});

export type AppStoreNotification = z.infer<typeof notificationSchema>;

export type AppStoreNotificationResult =
  | { status: "refunded" | "restored"; coffees: number }
  | {
      status: "ignored";
      reason:
        | "not-handled"
        | "sandbox"
        | "not-a-coffee"
        | "unknown-purchase"
        | "already-done";
    }
  | { status: "rejected"; reason: "invalid" | "wrong-app" };

/**
 * Handles an App Store Server Notification V2 (the signedPayload Apple posts).
 * A refund or revocation takes a counted coffee's coffees back off its season,
 * and a reversed refund adds them back, each once. Everything else verified,
 * TEST included, is acknowledged and changes nothing. "rejected" means the
 * payload isn't a notification Apple signed for this app.
 */
export async function handleAppStoreNotification(
  signedPayload: string,
  trustedRoot: string | Buffer = APPLE_ROOT_CA_G3_PEM,
): Promise<AppStoreNotificationResult> {
  let notification: AppStoreNotification;
  try {
    const parsed = notificationSchema.safeParse(
      verifyAppleSignedPayload(signedPayload, trustedRoot),
    );
    if (!parsed.success) throw new Error("payload isn't a notification");
    notification = parsed.data;
  } catch (error) {
    console.warn("App Store notification not verified:", error);
    return { status: "rejected", reason: "invalid" };
  }

  const { notificationType, data, summary } = notification;
  const bundleId = data?.bundleId ?? summary?.bundleId;
  if (bundleId != null && bundleId !== APP_BUNDLE_ID) {
    return { status: "rejected", reason: "wrong-app" };
  }

  const action =
    notificationType === "REFUND" || notificationType === "REVOKE"
      ? "refund"
      : notificationType === "REFUND_REVERSED"
        ? "restore"
        : null;
  if (!action) return { status: "ignored", reason: "not-handled" };

  // Sandbox and Xcode purchases were never counted, so there's nothing to undo.
  if (data?.environment !== "Production") {
    return { status: "ignored", reason: "sandbox" };
  }
  if (!data.signedTransactionInfo) {
    console.warn(`App Store ${notificationType} without a transaction`);
    return { status: "rejected", reason: "invalid" };
  }

  let transaction: AppStoreTransaction;
  try {
    transaction = verifyAppStoreTransaction(
      data.signedTransactionInfo,
      trustedRoot,
    );
  } catch (error) {
    console.warn("App Store notification transaction not verified:", error);
    return { status: "rejected", reason: "invalid" };
  }
  if (transaction.bundleId !== APP_BUNDLE_ID) {
    return { status: "rejected", reason: "wrong-app" };
  }
  if (transaction.environment !== "Production") {
    return { status: "ignored", reason: "sandbox" };
  }
  if (!coffeesPerProduct(transaction.productId)) {
    return { status: "ignored", reason: "not-a-coffee" };
  }

  const key = appStoreCoffeeKey(transaction);
  let result: CoffeeRefundResult;
  if (action === "refund") {
    const at = new Date(transaction.revocationDate ?? Date.now());
    result = await refundSeasonCoffees(key, at.toISOString());
  } else {
    result = await restoreSeasonCoffees(key);
  }

  if (result.status === "unknown") {
    console.warn(
      `App Store ${notificationType} for a coffee never counted: ${key}`,
    );
    return { status: "ignored", reason: "unknown-purchase" };
  }
  if (result.status === "unchanged") {
    return { status: "ignored", reason: "already-done" };
  }
  console.info(
    `App Store ${notificationType}: ${result.coffees} coffees for ${key}`,
  );
  return {
    status: action === "refund" ? "refunded" : "restored",
    coffees: result.coffees,
  };
}
