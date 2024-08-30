import * as zod from "zod";

export const ProfileSchema = zod.object({
	id: zod.string(),
	fullName: zod.string(),
});

export const MessageSchema = zod.object({
	id: zod.string(),
	text: zod.string(),
	isRead: zod.boolean(),
	readTime: zod.date().nullable(),
	isEdited: zod.boolean(),
	editTime: zod.date().nullable(),
	deletedBy: zod.array(ProfileSchema),
	profile: ProfileSchema,
});

export const GroupSchema = zod.object({
	id: zod.string(),
	name: zod.string(),
	isAdminOnly: zod.boolean(),
	admin: ProfileSchema,
});

export const RecentChatsResponseSchema = zod.object({
	onlineUsers: zod.array(
		zod.object({
			id: zod.string(),
		}),
	),
	privateChats: zod.array(
		zod.object({
			id: zod.string(),
			members: zod.array(ProfileSchema),
			messages: zod.array(MessageSchema),
		}),
	),
	groupChats: zod.array(
		zod.object({
			id: zod.string(),
			members: zod.array(ProfileSchema),
			messages: zod.array(MessageSchema),
			group: GroupSchema.omit({
				isAdminOnly: true,
				admin: true,
			}).nullable(),
		}),
	),
});

export const PrivateChatRoomResponseSchema = zod.object({
	room: zod
		.object({
			id: zod.string(),
			members: zod.array(ProfileSchema),
			messages: zod.array(MessageSchema),
		})
		.nullable(),
});

export type Profile = zod.infer<typeof ProfileSchema>;
export type Message = zod.infer<typeof MessageSchema>;
export type Group = zod.infer<typeof GroupSchema>;
export type RecentChatsResponse = zod.infer<typeof RecentChatsResponseSchema>;
export type PrivateChatRoomResponse = zod.infer<
	typeof PrivateChatRoomResponseSchema
>;
