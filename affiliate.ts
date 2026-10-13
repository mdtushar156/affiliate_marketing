import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const accountRole = pgEnum("affiliate_account_role", ["member", "admin"]);
export const accountStatus = pgEnum("affiliate_account_status", [
  "active",
  "suspended",
]);
export const paymentMethod = pgEnum("affiliate_payment_method", [
  "bkash",
  "nagad",
]);
export const reviewStatus = pgEnum("affiliate_review_status", [
  "pending",
  "approved",
  "rejected",
]);
export const transactionKind = pgEnum("affiliate_transaction_kind", [
  "deposit",
  "withdrawal",
  "purchase",
  "refund",
  "referral_commission",
  "adjustment",
]);
export const transactionDirection = pgEnum("affiliate_transaction_direction", [
  "credit",
  "debit",
  "hold",
  "release",
]);

export const membersTable = pgTable(
  "affiliate_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull().default("Member"),
    role: accountRole("role").notNull().default("member"),
    status: accountStatus("status").notNull().default("active"),
    balancePoisha: integer("balance_poisha").notNull().default(0),
    reservedPoisha: integer("reserved_poisha").notNull().default(0),
    referralCode: text("referral_code").notNull(),
    referredById: uuid("referred_by_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("affiliate_members_clerk_id_unique").on(table.clerkId),
    uniqueIndex("affiliate_members_email_unique").on(table.email),
    uniqueIndex("affiliate_members_referral_code_unique").on(table.referralCode),
    index("affiliate_members_referrer_idx").on(table.referredById),
  ],
);

export const packagesTable = pgTable(
  "affiliate_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    pricePoisha: integer("price_poisha").notNull(),
    description: text("description").notNull().default(""),
    benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("affiliate_packages_name_unique").on(table.name),
    index("affiliate_packages_active_idx").on(table.active),
  ],
);

export const siteSettingsTable = pgTable("affiliate_site_settings", {
  id: integer("id").primaryKey().default(1),
  websiteName: text("website_name").notNull().default("AFFILIATE MARKETING"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#102742"),
  accentColor: text("accent_color").notNull().default("#c59a54"),
  homepageTitle: text("homepage_title")
    .notNull()
    .default("Build with clarity. Grow through community."),
  homepageDescription: text("homepage_description")
    .notNull()
    .default(
      "Explore affiliate packages, track verified activity, and manage your account with confidence.",
    ),
  bannerImageUrl: text("banner_image_url"),
  announcement: text("announcement"),
  telegramUsername: text("telegram_username").notNull().default(""),
  referralCommissionPercent: numeric("referral_commission_percent", {
    precision: 5,
    scale: 2,
    mode: "number",
  })
    .notNull()
    .default(5),
  bkashNumber: text("bkash_number").notNull().default(""),
  nagadNumber: text("nagad_number").notNull().default(""),
  paymentInstructions: text("payment_instructions").notNull().default(""),
  minimumDepositPoisha: integer("minimum_deposit_poisha").notNull().default(0),
  minimumWithdrawalPoisha: integer("minimum_withdrawal_poisha")
    .notNull()
    .default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const depositRequestsTable = pgTable(
  "affiliate_deposit_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => membersTable.id),
    method: paymentMethod("method").notNull(),
    amountPoisha: integer("amount_poisha").notNull(),
    senderNumber: text("sender_number").notNull(),
    transactionId: text("transaction_id").notNull(),
    status: reviewStatus("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    reviewedBy: uuid("reviewed_by").references(() => membersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("affiliate_deposit_transaction_unique").on(table.transactionId),
    index("affiliate_deposit_member_idx").on(table.memberId, table.createdAt),
    index("affiliate_deposit_status_idx").on(table.status, table.createdAt),
  ],
);

export const withdrawalRequestsTable = pgTable(
  "affiliate_withdrawal_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => membersTable.id),
    method: paymentMethod("method").notNull(),
    amountPoisha: integer("amount_poisha").notNull(),
    recipientNumber: text("recipient_number").notNull(),
    status: reviewStatus("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    reviewedBy: uuid("reviewed_by").references(() => membersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("affiliate_withdrawal_member_idx").on(table.memberId, table.createdAt),
    index("affiliate_withdrawal_status_idx").on(table.status, table.createdAt),
  ],
);

export const purchaseRequestsTable = pgTable(
  "affiliate_purchase_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => membersTable.id),
    packageId: uuid("package_id").notNull(),
    packageName: text("package_name").notNull(),
    amountPoisha: integer("amount_poisha").notNull(),
    status: reviewStatus("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    reviewedBy: uuid("reviewed_by").references(() => membersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("affiliate_purchase_member_idx").on(table.memberId, table.createdAt),
    index("affiliate_purchase_status_idx").on(table.status, table.createdAt),
  ],
);

export const transactionsTable = pgTable(
  "affiliate_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => membersTable.id),
    kind: transactionKind("kind").notNull(),
    direction: transactionDirection("direction").notNull(),
    amountPoisha: integer("amount_poisha").notNull(),
    balanceAfterPoisha: integer("balance_after_poisha").notNull(),
    description: text("description").notNull(),
    referenceId: text("reference_id"),
    createdBy: uuid("created_by").references(() => membersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("affiliate_transactions_member_created_idx").on(
      table.memberId,
      table.createdAt,
    ),
    index("affiliate_transactions_reference_idx").on(table.referenceId),
    uniqueIndex("affiliate_transactions_commission_once")
      .on(table.referenceId)
      .where(sql`${table.kind} = 'referral_commission'`),
  ],
);

export const auditLogTable = pgTable(
  "affiliate_admin_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => membersTable.id),
    adminEmail: text("admin_email").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    details: text("details").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("affiliate_audit_created_idx").on(table.createdAt)],
);
