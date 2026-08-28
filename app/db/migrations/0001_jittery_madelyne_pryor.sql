CREATE TABLE "academy_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"pioneerUid" text NOT NULL,
	"moduleLocked" text NOT NULL,
	"status" text DEFAULT 'COMPLETED' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citizen_passports" (
	"id" serial PRIMARY KEY NOT NULL,
	"pioneerUid" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"piTxHash" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"piUsername" text NOT NULL,
	"decision" text NOT NULL,
	"pollId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"requiredWeight" double precision DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'BUFFER' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"pioneerUid" text NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"decision" text NOT NULL,
	"proposalId" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pi_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"paymentId" text NOT NULL,
	"pioneerUid" text NOT NULL,
	"amount" double precision DEFAULT 0.01 NOT NULL,
	"status" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pioneers" (
	"id" serial PRIMARY KEY NOT NULL,
	"pioneerUid" text NOT NULL,
	"role" text DEFAULT 'PIONEER' NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"trustScore" double precision DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_ledgers" (
	"id" serial PRIMARY KEY NOT NULL,
	"citizenUid" text NOT NULL,
	"status" text DEFAULT 'STASIS' NOT NULL,
	"nodeIp" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserWallet" (
	"id" serial PRIMARY KEY NOT NULL,
	"pioneerUid" text NOT NULL,
	"username" text DEFAULT 'Anonymous' NOT NULL,
	"mbzrBalance" double precision DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_votes" ADD CONSTRAINT "community_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "public"."community_polls"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "internal_votes" ADD CONSTRAINT "internal_votes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public"."internal_proposals"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "academy_logs_pioneerUid_idx" ON "academy_logs" USING btree ("pioneerUid" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "academy_logs_pioneerUid_moduleLocked_key" ON "academy_logs" USING btree ("pioneerUid" text_ops,"moduleLocked" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "citizen_passports_pioneerUid_key" ON "citizen_passports" USING btree ("pioneerUid" text_ops);--> statement-breakpoint
CREATE INDEX "community_votes_piUsername_idx" ON "community_votes" USING btree ("piUsername" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "community_votes_piUsername_pollId_key" ON "community_votes" USING btree ("piUsername" int4_ops,"pollId" int4_ops);--> statement-breakpoint
CREATE INDEX "internal_votes_pioneerUid_idx" ON "internal_votes" USING btree ("pioneerUid" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "internal_votes_pioneerUid_proposalId_key" ON "internal_votes" USING btree ("pioneerUid" int4_ops,"proposalId" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "pi_payments_paymentId_key" ON "pi_payments" USING btree ("paymentId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "pioneers_pioneerUid_key" ON "pioneers" USING btree ("pioneerUid" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_ledgers_citizenUid_key" ON "recovery_ledgers" USING btree ("citizenUid" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "UserWallet_pioneerUid_key" ON "UserWallet" USING btree ("pioneerUid" text_ops);