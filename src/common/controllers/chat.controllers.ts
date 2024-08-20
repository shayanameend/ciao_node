import { default as chalk } from "chalk";
import type { Socket, Server as SocketServer } from "socket.io";
import { db } from "../../db.js";
import { default as events } from "../../events.js";
import type { JWTUserType } from "../../validators/auth.validators.js";
import type { ChatRoomJoinResponse } from "../../validators/chat.validators.js";

interface SocketParams {
	io: SocketServer;
	socket: Socket;
	user: JWTUserType;
}

interface JoinChatRoomParams {
	otherUserId: string;
}

interface ReceiveChatRoomMessagesParams {
	roomId: string;
}

interface ReadChatRoomMessagesParams {
	roomId: string;
}

interface DeleteChatRoomMessagesParams {
	roomId: string;
}

interface LeaveChatRoomParams {
	roomId: string;
}

interface ArchiveChatRoomParams {
	roomId: string;
}

interface DeleteChatRoomParams {
	roomId: string;
}

interface SendChatRoomMessageParams {
	roomId: string;
	text: string;
}

interface ReadChatRoomMessageParams {
	messageId: string;
}

interface EditChatRoomMessageParams {
	messageId: string;
	newText: string;
}

interface DeleteChatRoomMessageParams {
	messageId: string;
}

export async function joinPrivateChatRoom(
	{ io: _io, socket, user }: SocketParams,
	{ otherUserId }: JoinChatRoomParams,
	callback?: ({
		error,
		data,
	}: {
		error?: unknown;
		data: ChatRoomJoinResponse;
	}) => void,
) {
	try {
		const profile1 = await db.profile.findFirst({
			where: {
				userId: user.id,
			},
			select: {
				id: true,
			},
		});

		const profile2 = await db.profile.findFirst({
			where: {
				userId: otherUserId,
			},
			select: {
				id: true,
			},
		});

		if (!profile1 || !profile2) {
			return socket.emit(events.socket.error, {
				message: "Profile not found",
			});
		}

		let room = await db.room.findFirst({
			where: {
				members: {
					every: {
						id: {
							in: [profile1.id, profile2.id],
						},
					},
				},
			},
			select: {
				id: true,
				members: {
					select: {
						id: true,
						fullName: true,
					},
				},
				group: {
					select: {
						id: true,
						name: true,
						isAdminOnly: true,
						admin: {
							select: { id: true, fullName: true },
						},
					},
				},
				messages: {
					select: {
						id: true,
						text: true,
						deletedBy: {
							select: {
								id: true,
								fullName: true,
							},
						},
						isEdited: true,
						editTime: true,
						isRead: true,
						readTime: true,
						profile: {
							select: { id: true, fullName: true },
						},
					},
				},
			},
		});

		if (!room) {
			room = await db.room.create({
				data: {
					members: {
						connect: [{ id: profile1.id }, { id: profile2.id }],
					},
				},
				select: {
					id: true,
					members: {
						select: {
							id: true,
							fullName: true,
						},
					},
					group: {
						select: {
							id: true,
							name: true,
							isAdminOnly: true,
							admin: {
								select: { id: true, fullName: true },
							},
						},
					},
					messages: {
						select: {
							id: true,
							text: true,
							deletedBy: {
								select: {
									id: true,
									fullName: true,
								},
							},
							isEdited: true,
							editTime: true,
							isRead: true,
							readTime: true,
							profile: {
								select: { id: true, fullName: true },
							},
						},
					},
				},
			});
		}

		socket.join(room.id);

		console.log(chalk.cyan(`User Joined Room: ${user.id}`));

		if (callback) {
			return callback({
				data: { room },
			});
		}
	} catch (error) {
		console.log(chalk.red(`Error Joining Room: ${user.id}`));
		console.error(error);

		if (callback) {
			return callback({
				error,
				data: { room: null },
			});
		}
	}
}

export async function receivePrivateChatRoomMessages(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: ReceiveChatRoomMessagesParams,
	callback?: ({
		error,
		data,
	}: {
		error?: unknown;
		data: unknown[];
	}) => void,
) {}

export async function readPrivateChatRoomMessages(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: ReadChatRoomMessagesParams,
) {}

export async function deletePrivateChatRoomMessages(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: DeleteChatRoomMessagesParams,
) {}

export async function sendPrivateChatRoomMessage(
	{ io: _io, socket, user }: SocketParams,
	{ roomId, text }: SendChatRoomMessageParams,
) {}

export async function readPrivateChatRoomMessage(
	{ io: _io, socket, user }: SocketParams,
	{ messageId }: ReadChatRoomMessageParams,
) {}

export async function editPrivateChatRoomMessage(
	{ io: _io, socket, user }: SocketParams,
	{ messageId, newText }: EditChatRoomMessageParams,
) {}

export async function deletePrivateChatRoomMessage(
	{ io: _io, socket, user }: SocketParams,
	{ messageId }: DeleteChatRoomMessageParams,
) {}

export async function leavePrivateChatRoom(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: LeaveChatRoomParams,
) {
	socket.leave(roomId);

	console.log(chalk.cyan(`User Left Room: ${user.id}`));
}

export async function archivePrivateChatRoom(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: ArchiveChatRoomParams,
) {
	try {
		const profile = await db.profile.findUnique({
			where: {
				userId: user.id,
			},
			select: {
				id: true,
			},
		});

		if (!profile) {
			return socket.emit(events.socket.error, {
				message: "Profile not found",
			});
		}

		await db.room.update({
			where: {
				id: roomId,
			},
			data: {
				archivedBy: {
					connect: {
						id: profile.id,
					},
				},
			},
		});

		console.log(chalk.cyan(`Room Archived: ${roomId} by ${user.id}`));
	} catch (error) {
		console.log(chalk.red(`Error Archiving Room: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error archiving room",
		});
	}
}

export async function deletePrivateChatRoom(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: DeleteChatRoomParams,
) {
	try {
		const profile = await db.profile.findUnique({
			where: {
				userId: user.id,
			},
			select: {
				id: true,
			},
		});

		if (!profile) {
			return socket.emit(events.socket.error, {
				message: "Profile not found",
			});
		}

		await db.room.update({
			where: {
				id: roomId,
			},
			data: {
				deletedBy: {
					connect: {
						id: profile.id,
					},
				},
			},
		});

		console.log(chalk.cyan(`Room Deleted: ${roomId} by ${user.id}`));
	} catch (error) {
		console.log(chalk.red(`Error Deleting Room: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error deleting room",
		});
	}
}
