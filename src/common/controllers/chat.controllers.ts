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

		const messages = await db.message.findMany({
			where: {
				roomId,
			},
			select: {
				id: true,
				text: true,
				isEdited: true,
				editTime: true,
				isRead: true,
				readTime: true,
				deletedBy: {
					select: {
						id: true,
						fullName: true,
					},
				},
				profile: {
					select: {
						id: true,
						fullName: true,
					},
				},
				room: {
					select: {
						id: true,
						members: {
							select: {
								id: true,
								fullName: true,
							},
						},
					},
				},
			},
		});

		console.log(
			chalk.cyan(`Messages Received: ${messages.length} in ${roomId}`),
		);

		if (callback) {
			return callback({
				data: messages.filter(
					(message) =>
						!message.deletedBy
							.map((deletedBy) => deletedBy.id)
							.includes(profile.id),
				),
			});
		}
	} catch (error) {
		console.log(chalk.red(`Error Receiving Messages: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error receiving messages",
		});

		if (callback) {
			return callback({
				error,
				data: [],
			});
		}
	}
}

export async function readPrivateChatRoomMessages(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: ReadChatRoomMessagesParams,
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

		const messages = await db.message.updateMany({
			where: {
				roomId,
				isRead: false,
			},
			data: {
				isRead: true,
				readTime: new Date(),
			},
		});

		console.log(chalk.cyan(`Messages Read: ${messages.count} in ${roomId}`));
	} catch (error) {
		console.log(chalk.red(`Error Reading Messages: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error reading messages",
		});
	}
}

export async function deletePrivateChatRoomMessages(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: DeleteChatRoomMessagesParams,
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

		const messages = await db.message.findMany({
			where: {
				roomId,
			},
		});

		const messagesUpdates = messages.map((message) => {
			return db.message.update({
				where: { id: message.id },
				data: {
					deletedBy: {
						connect: {
							id: profile.id,
						},
					},
				},
			});
		});

		await db.$transaction(messagesUpdates);

		console.log(
			chalk.cyan(`Messages Deleted: ${messages.length} in ${roomId}`),
		);
	} catch (error) {
		console.log(chalk.red(`Error Deleting Messages: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error deleting messages",
		});
	}
}

export async function sendPrivateChatRoomMessage(
	{ io, socket, user }: SocketParams,
	{ roomId, text }: SendChatRoomMessageParams,
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

		const message = await db.message.create({
			data: {
				text,
				profile: {
					connect: { id: profile.id },
				},
				room: {
					connect: { id: roomId },
				},
			},
		});

		io.to(roomId).emit(events.privateChat.message.receive, {
			message,
		});

		console.log(chalk.cyan(`Message Sent: ${message.id} in ${roomId}`));
	} catch (error) {
		console.log(chalk.red(`Error Sending Message: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error sending message",
		});
	}
}

export async function readPrivateChatRoomMessage(
	{ io, socket, user }: SocketParams,
	{ messageId }: ReadChatRoomMessageParams,
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

		const updatedMessage = await db.message.update({
			where: { id: messageId },
			data: {
				isRead: true,
				readTime: new Date(),
			},
		});

		io.to(updatedMessage.roomId).emit(events.privateChat.message.receive, {
			message: updatedMessage,
		});

		console.log(
			chalk.cyan(
				`Message Read: ${updatedMessage.id} in ${updatedMessage.roomId}`,
			),
		);
	} catch (error) {
		console.log(chalk.red(`Error Reading Message: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error reading message",
		});
	}
}

export async function editPrivateChatRoomMessage(
	{ io, socket, user }: SocketParams,
	{ messageId, newText }: EditChatRoomMessageParams,
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

		const updatedMessage = await db.message.update({
			where: { id: messageId },
			data: {
				text: newText,
				isEdited: true,
				editTime: new Date(),
			},
		});

		io.to(updatedMessage.roomId).emit(events.privateChat.message.receive, {
			message: updatedMessage,
		});

		console.log(
			chalk.cyan(
				`Message Edited: ${updatedMessage.id} in ${updatedMessage.roomId}`,
			),
		);
	} catch (error) {
		console.log(chalk.red(`Error Editing Message: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error editing message",
		});
	}
}

export async function deletePrivateChatRoomMessage(
	{ io: _io, socket, user }: SocketParams,
	{ messageId }: DeleteChatRoomMessageParams,
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

		await db.message.update({
			where: { id: messageId },
			data: {
				deletedBy: {
					connect: { id: profile.id },
				},
			},
		});

		console.log(chalk.cyan(`Message Deleted: ${messageId}`));
	} catch (error) {
		console.log(chalk.red(`Error Deleting Message: ${user.id}`));
		console.error(error);

		socket.emit(events.socket.error, {
			message: "Error deleting message",
		});
	}
}

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
