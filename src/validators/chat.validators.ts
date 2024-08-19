import * as zod from "zod";

export const ChatRoomJoinResponseSchema = zod.object({
	room: zod.nullable(
		zod.object({
			id: zod.string(),
			messages: zod.array(
				zod.object({
					id: zod.string(),
					text: zod.string(),
					isRead: zod.boolean(),
					readTime: zod.date().nullable(),
					profile: zod.object({
						id: zod.string(),
						fullName: zod.string(),
						dob: zod.date(),
						isOnline: zod.boolean(),
					}),
				}),
			),
			group: zod.nullable(
				zod.object({
					id: zod.string(),
					name: zod.string(),
					isAdminOnly: zod.boolean(),
					admin: zod.object({
						id: zod.string(),
						fullName: zod.string(),
						dob: zod.date(),
						isOnline: zod.boolean(),
					}),
				}),
			),
		}),
	),
});

export type ChatRoomJoinResponse = zod.infer<typeof ChatRoomJoinResponseSchema>;
