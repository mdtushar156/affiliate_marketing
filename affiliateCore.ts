import { randomBytes } from "node:crypto";
import { clerkClient } from "@clerk/express";
import {
  and,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import { db } from "@workspace/db";
import {
  depositRequestsTable,
  membersTable,
  packagesTable,
  purchaseRequestsTable,
  siteSettingsTable,
  transactionsTable,
  withdrawalRequestsTable,
} from "@workspace/db/schema";

export type Member = typeof membersTable.$inferSelect;

export const poisha = (amount: number): number => Math.round(amount * 100);
export const taka = (amount: number): number => amount / 100;

const starterPackageExamples = [
    {
      name: "Bronze",
      pricePoisha: 50000,
      description: "A simple starting point for exploring the member program.",
      benefits: ["Member account access", "Referral link and activity history"],
    },
    {
      name: "Silver",
      pricePoisha: 120000,
      description: "Additional learning resources for active members.",
      benefits: ["Member account access", "Referral tools", "Learning resources"],
    },
    {
      name: "Gold",
      pricePoisha: 250000,
      description: "A broader set of resources and account support.",
      benefits: ["Member account access", "Referral tools", "Priority support"],
    },
    {
      name: "Platinum",
      pricePoisha: 500000,
      description: "Expanded resources for experienced members.",
      benefits: ["Member account access", "Referral tools", "Expanded resources"],
    },
    {
      name: "Diamond",
      pricePoisha: 1000000,
      description: "The full package of available member resources.",
      benefits: ["Member account access", "Referral tools", "Full resource library"],
    },
] as const;

export function isUncustomizedStarterPackage(
  item: Pick<
    typeof packagesTable.$inferSelect,
    "name" | "pricePoisha" | "description" | "benefits"
  >,
): boolean {
  const example = starterPackageExamples.find(
    (candidate) => candidate.name === item.name,
  );
  return Boolean(
    example &&
      item.pricePoisha === example.pricePoisha &&
      item.description === example.description &&
      JSON.stringify(item.benefits) === JSON.stringify(example.benefits),
  );
}

export async function ensureInitialData(): Promise<void> {
  await db.transaction(async (tx) => {
    // Serialize one-time initialization across concurrent server starts.
    await tx.execute(sql`select pg_advisory_xact_lock(638274913)`);
    await tx
      .insert(siteSettingsTable)
      .values({ id: 1 })
      .onConflictDoNothing({ target: siteSettingsTable.id });
  });
}

export async function ensureMember(
  clerkId: string,
  email: string,
  fullName: string,
  referralCode?: string,
): Promise<Member> {
  const normalizedEmail = email.trim().toLowerCase();
  const configuredAdmin =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const authorizedAdmin =
    configuredAdmin.length > 0 && normalizedEmail === configuredAdmin;
  const [existing] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.clerkId, clerkId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(membersTable)
      .set({
        email: normalizedEmail,
        fullName: fullName.trim() || "Member",
        role: authorizedAdmin ? "admin" : "member",
        updatedAt: new Date(),
      })
      .where(eq(membersTable.id, existing.id))
      .returning();
    return updated;
  }

  let referrerId: string | null = null;
  const code = referralCode?.trim();
  if (code) {
    const [referrer] = await db
      .select({ id: membersTable.id })
      .from(membersTable)
      .where(eq(membersTable.referralCode, code))
      .limit(1);
    if (referrer) referrerId = referrer.id;
  }

  const [created] = await db
    .insert(membersTable)
    .values({
      clerkId,
      email: normalizedEmail,
      fullName: fullName.trim() || "Member",
      role: authorizedAdmin ? "admin" : "member",
      referralCode: randomBytes(8).toString("hex").toUpperCase(),
      referredById: referrerId,
    })
    .returning();
  return created;
}

export async function getVerifiedIdentity(clerkId: string): Promise<{
  email: string;
  fullName: string;
}> {
  const identity = await clerkClient.users.getUser(clerkId);
  const primary = identity.emailAddresses.find(
    (item) => item.id === identity.primaryEmailAddressId,
  );
  if (!primary || primary.verification?.status !== "verified") {
    throw new Error("A verified primary email is required.");
  }
  const fullName =
    [identity.firstName, identity.lastName].filter(Boolean).join(" ") ||
    identity.username ||
    primary.emailAddress.split("@")[0] ||
    "Member";
  return { email: primary.emailAddress, fullName };
}

export function publicSettings(settings: typeof siteSettingsTable.$inferSelect) {
  return {
    websiteName: settings.websiteName,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor,
    accentColor: settings.accentColor,
    homepageTitle: settings.homepageTitle,
    homepageDescription: settings.homepageDescription,
    bannerImageUrl: settings.bannerImageUrl,
    announcement: settings.announcement,
    telegramUsername: settings.telegramUsername,
    referralCommissionPercent: settings.referralCommissionPercent,
    bkashNumber: settings.bkashNumber,
    nagadNumber: settings.nagadNumber,
    paymentInstructions: settings.paymentInstructions,
    minimumDeposit: taka(settings.minimumDepositPoisha),
    minimumWithdrawal: taka(settings.minimumWithdrawalPoisha),
  };
}

export function mapPackage(item: typeof packagesTable.$inferSelect) {
  return {
    ...item,
    price: taka(item.pricePoisha),
    imageUrl: item.imageUrl,
  };
}

export function mapMember(member: Member, transactionCount = 0) {
  return {
    id: member.id,
    email: member.email,
    fullName: member.fullName,
    role: member.role,
    status: member.status,
    balance: taka(member.balancePoisha),
    reservedBalance: taka(member.reservedPoisha),
    referralCode: member.referralCode,
    referredBy: member.referredById,
    createdAt: member.createdAt,
    transactionCount,
  };
}

export function mapTransaction(item: typeof transactionsTable.$inferSelect) {
  return {
    id: item.id,
    type: item.kind,
    direction: item.direction,
    amount: taka(item.amountPoisha),
    balanceAfter: taka(item.balanceAfterPoisha),
    description: item.description,
    referenceId: item.referenceId,
    createdAt: item.createdAt,
  };
}

export function mapDeposit(
  item: typeof depositRequestsTable.$inferSelect,
) {
  return {
    id: item.id,
    method: item.method,
    amount: taka(item.amountPoisha),
    senderNumber: item.senderNumber,
    transactionId: item.transactionId,
    status: item.status,
    adminNote: item.adminNote,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt,
  };
}

export function mapWithdrawal(
  item: typeof withdrawalRequestsTable.$inferSelect,
) {
  return {
    id: item.id,
    method: item.method,
    amount: taka(item.amountPoisha),
    recipientNumber: item.recipientNumber,
    status: item.status,
    adminNote: item.adminNote,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt,
  };
}

export function mapPurchase(
  item: typeof purchaseRequestsTable.$inferSelect,
) {
  return {
    id: item.id,
    packageId: item.packageId,
    packageName: item.packageName,
    amount: taka(item.amountPoisha),
    status: item.status,
    adminNote: item.adminNote,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt,
  };
}

export async function loadSettings() {
  const [settings] = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, 1))
    .limit(1);
  if (!settings) throw new Error("Site settings have not been initialized.");
  return settings;
}

export async function recentTransactions(memberId: string, limit = 10) {
  const rows = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.memberId, memberId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit);
  return rows.map(mapTransaction);
}

export async function countTransactions(memberId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable)
    .where(eq(transactionsTable.memberId, memberId));
  return row?.count ?? 0;
}

export async function activeMember(memberId: string): Promise<Member | null> {
  const [member] = await db
    .select()
    .from(membersTable)
    .where(and(eq(membersTable.id, memberId), eq(membersTable.status, "active")))
    .limit(1);
  return member ?? null;
}
