import { relations } from "drizzle-orm/relations";
import { communityPolls, communityVotes, internalProposals, internalVotes } from "./schema";

export const communityVotesRelations = relations(communityVotes, ({one}) => ({
	communityPoll: one(communityPolls, {
		fields: [communityVotes.pollId],
		references: [communityPolls.id]
	}),
}));

export const communityPollsRelations = relations(communityPolls, ({many}) => ({
	communityVotes: many(communityVotes),
}));

export const internalVotesRelations = relations(internalVotes, ({one}) => ({
	internalProposal: one(internalProposals, {
		fields: [internalVotes.proposalId],
		references: [internalProposals.id]
	}),
}));

export const internalProposalsRelations = relations(internalProposals, ({many}) => ({
	internalVotes: many(internalVotes),
}));