import { default as chalk } from "chalk";
import { db } from "../../db.js";
import { default as events } from "../../events.js";
import type { SocketParams } from "../../types.js";
import type { ChatRoomResponse } from "../../validators/chat.validators.js";

interface CreateChatRoomParams {
	otherUserId: string;
}

interface JoinChatRoomParams {
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

export async function createPrivateChatRoom(
	{ socket, user }: SocketParams,
	{ otherUserId }: CreateChatRoomParams,
	callback?: ({
		error,
		data,
	}: {
		error?: unknown;
		data: ChatRoomResponse;
	}) => void,
) {
	try {
		const profile = await db.profile.findFirst({
			where: {
				userId: user.id,
			},
			select: {
				id: true,
			},
		});

		if (!profile) {
			throw new Error("Profile not found");
		}

		const room = await db.room.create({
			data: {
				members: {
					connect: [{ id: profile.id }, { id: otherUserId }],
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
				messages: {
					select: {
						id: true,
						text: true,
						isRead: true,
						readTime: true,
						isEdited: true,
						editTime: true,
						deletedBy: {
							select: {
								id: true,
								fullName: true,
							},
						},
						profile: {
							select: { id: true, fullName: true },
						},
					},
				},
			},
		});

		socket.join(room.id);

		console.log(chalk.cyan(`User Created Room: ${user.id}`));

		if (callback) {
			return callback({
				data: { room },
			});
		}
	} catch (error) {
		console.log(chalk.red(`Error Creating Room: ${user.id}`));
		console.error(error);

		if (callback) {
			callback({
				error,
				data: { room: null },
			});
		}

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
			message: "Error creating room",
		});
	}
}

export async function joinPrivateChatRoom(
	{ socket, user }: SocketParams,
	{ roomId }: JoinChatRoomParams,
	callback?: ({
		error,
		data,
	}: {
		error?: unknown;
		data: ChatRoomResponse;
	}) => void,
) {
	try {
		const profile = await db.profile.findFirst({
			where: {
				userId: user.id,
			},
			select: {
				id: true,
			},
		});

		if (!profile) {
			throw new Error("Profile not found");
		}

		const room = await db.room.findFirst({
			where: {
				id: roomId,
			},
			select: {
				id: true,
				members: {
					select: {
						id: true,
						fullName: true,
					},
				},
				messages: {
					select: {
						id: true,
						text: true,
						isRead: true,
						readTime: true,
						isEdited: true,
						editTime: true,
						deletedBy: {
							select: {
								id: true,
								fullName: true,
							},
						},
						profile: {
							select: { id: true, fullName: true },
						},
					},
				},
			},
		});

		if (!room) {
			throw new Error("Room not found");
		}

		socket.join(room.id);

		console.log(chalk.cyan(`User ${user.id} Joined Room ${room.id}`));

		if (callback) {
			return callback({
				data: { room },
			});
		}
	} catch (error) {
		console.log(chalk.red(`User ${user.id} Errored Joining Room`));
		console.error(error);

		if (callback) {
			callback({
				error,
				data: { room: null },
			});
		}

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
			message: "Error joining room",
		});
	}
}

export async function readPrivateChatRoomMessages(
	{ io, socket, user }: SocketParams,
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
			throw new Error("Profile not found");
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

		io.to(roomId).emit(events.privateChat.messages.receive, {
			messages,
		});

		console.log(
			chalk.cyan(
				`User ${user.id} Read ${messages.count} Messages in Room ${roomId}`,
			),
		);
	} catch (error) {
		console.log(
			chalk.red(`User ${user.id} Errored Reading Messages in Room ${roomId}`),
		);
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
			message: "Error reading messages",
		});
	}
}

export async function deletePrivateChatRoomMessages(
	{ socket, user }: SocketParams,
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
			throw new Error("Profile not found");
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
			chalk.cyan(
				`User ${user.id} Deleted ${messages.length} Messages in Room ${roomId}`,
			),
		);
	} catch (error) {
		console.log(
			chalk.red(`User ${user.id} Errored Deleting Messages in Room ${roomId}`),
		);
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
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
			throw new Error("Profile not found");
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
			select: {
				id: true,
				text: true,
				isRead: true,
				readTime: true,
				isEdited: true,
				editTime: true,
				deletedBy: {
					select: { id: true, fullName: true },
				},
				profile: {
					select: { id: true, fullName: true },
				},
				room: {
					select: { id: true },
				},
			},
		});

		io.to(roomId).emit(events.privateChat.message.receive, {
			message,
		});

		console.log(
			chalk.cyan(
				`User ${user.id} Sent Message ${message.id} in Room ${roomId}`,
			),
		);

		const room = await db.room.findUnique({
			where: { id: roomId },
			select: { members: { select: { id: true } } },
		});

		for (const member of room?.members || []) {
			const privateChats = await db.room.findMany({
				where: {
					members: {
						some: {
							id: member.id,
						},
					},
					group: {
						is: null,
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
					messages: {
						select: {
							id: true,
							text: true,
							profile: {
								select: { id: true, fullName: true },
							},
						},
						orderBy: {
							createdAt: "desc",
						},
						take: 1,
					},
				},
			});

			io.to(member.id).emit(events.recentChats.privateChats.receive, {
				privateChats,
			});

			console.log(
				chalk.cyan(`User ${user.id} Updated Private Chats for ${member.id}`),
			);
		}
	} catch (error) {
		console.log(
			chalk.red(`User ${user.id} Errored Sending Message in Room ${roomId}`),
		);
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
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
			throw new Error("Profile not found");
		}

		const updatedMessage = await db.message.update({
			where: { id: messageId },
			data: {
				isRead: true,
				readTime: new Date(),
			},
			select: {
				id: true,
				text: true,
				isRead: true,
				readTime: true,
				isEdited: true,
				editTime: true,
				deletedBy: {
					select: { id: true, fullName: true },
				},
				profile: {
					select: { id: true, fullName: true },
				},
				room: {
					select: { id: true },
				},
			},
		});

		io.to(updatedMessage.room.id).emit(events.privateChat.message.receive, {
			message: updatedMessage,
		});

		console.log(
			chalk.cyan(
				`User ${user.id} Read Message ${updatedMessage.id} in Room ${updatedMessage.room.id}`,
			),
		);
	} catch (error) {
		console.log(
			chalk.red(`User ${user.id} Errored Reading Message: ${messageId}`),
		);
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
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
			throw new Error("Profile not found");
		}

		const updatedMessage = await db.message.update({
			where: { id: messageId },
			data: {
				text: newText,
				isEdited: true,
				editTime: new Date(),
			},
			select: {
				id: true,
				text: true,
				isRead: true,
				readTime: true,
				isEdited: true,
				editTime: true,
				deletedBy: {
					select: { id: true, fullName: true },
				},
				profile: {
					select: { id: true, fullName: true },
				},
				room: {
					select: { id: true },
				},
			},
		});

		io.to(updatedMessage.room.id).emit(events.privateChat.message.receive, {
			message: updatedMessage,
		});

		console.log(
			chalk.cyan(
				`User ${user.id} Edited Message ${updatedMessage.id} in Room ${updatedMessage.room.id}`,
			),
		);

		const room = await db.room.findUnique({
			where: { id: updatedMessage.room.id },
			select: { members: { select: { id: true } } },
		});

		for (const member of room?.members || []) {
			const privateChats = await db.room.findMany({
				where: {
					members: {
						some: {
							id: member.id,
						},
					},
					group: {
						is: null,
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
					messages: {
						select: {
							id: true,
							text: true,
							profile: {
								select: { id: true, fullName: true },
							},
						},
						orderBy: {
							createdAt: "desc",
						},
						take: 1,
					},
				},
			});

			io.to(member.id).emit(events.recentChats.privateChats.receive, {
				privateChats,
			});

			console.log(
				chalk.cyan(`User ${user.id} Updated Private Chats for ${member.id}`),
			);
		}
	} catch (error) {
		console.log(
			chalk.red(`User ${user.id} Errored Editing Message ${messageId}`),
		);
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
			message: "Error editing message",
		});
	}
}

export async function deletePrivateChatRoomMessage(
	{ socket, user }: SocketParams,
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
			throw new Error("Profile not found");
		}

		await db.message.update({
			where: { id: messageId },
			data: {
				deletedBy: {
					connect: { id: profile.id },
				},
			},
		});

		console.log(chalk.cyan(`User ${user.id} Deleted Message ${messageId}`));
	} catch (error) {
		console.log(
			chalk.red(`User ${user.id} Errored Deleting Message ${messageId}`),
		);
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
			message: "Error deleting message",
		});
	}
}

export async function leavePrivateChatRoom(
	{ socket, user }: SocketParams,
	{ roomId }: LeaveChatRoomParams,
) {
	socket.leave(roomId);

	console.log(chalk.cyan(`User ${user.id} Left Room ${roomId}`));
}

export async function archivePrivateChatRoom(
	{ socket, user }: SocketParams,
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
			throw new Error("Profile not found");
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

		console.log(chalk.cyan(`User ${user.id} Archived Room ${roomId}`));
	} catch (error) {
		console.log(chalk.red(`User ${user.id} Errored Archiving Room ${roomId}`));
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
			message: "Error archiving room",
		});
	}
}

export async function deletePrivateChatRoom(
	{ socket, user }: SocketParams,
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
			throw new Error("Profile not found");
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

		console.log(chalk.cyan(`User ${user.id} Deleted Room ${roomId}`));
	} catch (error) {
		console.log(chalk.red(`User ${user.id} Errored Deleting Room ${roomId}`));
		console.error(error);

		if (error instanceof Error) {
			return socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		return socket.emit(events.socket.error, {
			message: "Error deleting room",
		});
	}
}
