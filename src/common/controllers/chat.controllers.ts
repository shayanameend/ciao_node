import { db } from "../../db.js";
import type { Socket, Server as SocketServer } from "socket.io";
import { default as events } from "../../events.js";
import { default as chalk } from "chalk";
import type { JWTUserType } from "../../validators/auth.validators.js";

export async function joinChatRoom(
	{ io, socket, user }: { io: SocketServer; socket: Socket; user: JWTUserType },
	{ otherUserId }: { otherUserId: string },
	callback: ({
		data: { room },
	}: {
		data: {
			room: {
				id: string;
				messages: {
					id: string;
					text: string;
					isRead: boolean;
					readTime: Date | null;
					profile: {
						id: string;
						fullName: string;
						dob: Date;
						isOnline: boolean;
					};
				}[];
				group: {
					name: string;
					id: string;
					isAdminOnly: boolean;
					admin: {
						id: string;
						fullName: string;
						dob: Date;
						isOnline: boolean;
					};
				} | null;
			} | null;
		};
	}) => void,
) {
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

	console.log(chalk.cyan(`User Joined Room: ${user.id}`));

	if (callback) {
		return callback({
			data: { room },
		});
	}
}
