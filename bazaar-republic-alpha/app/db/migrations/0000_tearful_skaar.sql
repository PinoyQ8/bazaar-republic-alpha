CREATE TABLE "security_circle_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"wallet_address" varchar(56) NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "security_circle_nodes_username_unique" UNIQUE("username"),
	CONSTRAINT "security_circle_nodes_wallet_address_unique" UNIQUE("wallet_address")
);
