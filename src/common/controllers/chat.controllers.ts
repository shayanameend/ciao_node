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

export async function joinChatRoom(
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
				profiles: {
					every: {
						id: {
							in: [profile1.id, profile2.id],
						},
					},
				},
			},
			select: {
				id: true,
				group: {
					select: {
						id: true,
						name: true,
						isAdminOnly: true,
						admin: {
							select: { id: true, fullName: true, dob: true, isOnline: true },
						},
					},
				},
				messages: {
					select: {
						id: true,
						text: true,
						isRead: true,
						readTime: true,
						profile: {
							select: { id: true, fullName: true, dob: true, isOnline: true },
						},
					},
				},
			},
		});

		if (!room) {
			room = await db.room.create({
				data: {
					profiles: {
						connect: [{ id: profile1.id }, { id: profile2.id }],
					},
				},
				select: {
					id: true,
					group: {
						select: {
							id: true,
							name: true,
							isAdminOnly: true,
							admin: {
								select: { id: true, fullName: true, dob: true, isOnline: true },
							},
						},
					},
					messages: {
						select: {
							id: true,
							text: true,
							isRead: true,
							readTime: true,
							profile: {
								select: { id: true, fullName: true, dob: true, isOnline: true },
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

		if (callback) {
			return callback({
				error,
				data: { room: null },
			});
		}
	}
}

export async function leaveChatRoom(
	{ io: _io, socket, user }: SocketParams,
	{ roomId }: { roomId: string },
) {
	socket.leave(roomId);

	console.log(chalk.cyan(`User Left Room: ${user.id}`));
}
