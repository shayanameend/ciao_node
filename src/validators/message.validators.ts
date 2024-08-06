import * as zod from "zod";

export const messageResponseValidator = zod.object({
	id: zod.string(),
	text: zod.string(),
	updatedAt: zod.date(),
});

export type MessageResponseType = zod.infer<typeof messageResponseValidator>;
