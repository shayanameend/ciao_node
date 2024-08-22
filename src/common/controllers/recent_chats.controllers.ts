import chalk from "chalk";
import { db } from "../../db.js";
import events from "../../events.js";
import type { SocketParams } from "../../types.js";

export async function joinRecentChatsRoom({ io, socket, user }: SocketParams) {
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

		await db.profile.update({
			where: {
				id: profile.id,
			},
			data: {
				isOnline: true,
			},
		});

		socket.join(profile.id);

		const privateChats = await db.room.findMany({
			where: {
				members: {
					some: {
						id: profile.id,
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
				},
			},
		});

		io.to(profile.id).emit(events.recentChats.privateChats.receive, {
			privateChats,
		});

		const groupChats = await db.room.findMany({
			where: {
				members: {
					some: {
						id: profile.id,
					},
				},
				group: {
					isNot: null,
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
				},
			},
		});

		io.to(profile.id).emit(events.recentChats.groupChats.receive, {
			groupChats,
		});

		const chats = [...privateChats, ...groupChats];
		const allMembers = chats.flatMap((chat) => chat.members);
		const uniqueMemberIds = [...new Set(allMembers.map((member) => member.id))];

		const onlineUsers = await db.profile.findMany({
			where: {
				id: { in: uniqueMemberIds },
				isOnline: true,
			},
			select: {
				id: true,
			},
		});

		io.to(profile.id).emit(events.recentChats.users.online, {
			onlineUsers,
		});

		for (const member of allMembers) {
			if (member.id !== profile.id) {
				io.to(member.id).emit(events.recentChats.users.online, {
					onlineUsers: [{ id: profile.id }],
				});
			}
		}

		console.log(chalk.green("Joined recent chats room"));
	} catch (error) {
		console.log(chalk.red("Error joining recent chats room"));
		console.error(error);

		if (error instanceof Error) {
			socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		socket.emit(events.socket.error, {
			message: "Error joining recent chats room",
		});
	}
}

export async function leaveRecentChatsRoom({ io, socket, user }: SocketParams) {
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

		await db.profile.update({
			where: {
				id: profile.id,
			},
			data: {
				isOnline: false,
			},
		});

		const chats = await db.room.findMany({
			where: {
				members: {
					some: {
						id: profile.id,
					},
				},
			},
			select: {
				members: {
					select: {
						id: true,
					},
				},
			},
		});

		const allMembers = chats.flatMap((chat) => chat.members);
		const uniqueMemberIds = [...new Set(allMembers.map((member) => member.id))];

		for (const memberId of uniqueMemberIds) {
			if (memberId !== profile.id) {
				io.to(memberId).emit(events.recentChats.users.offline, {
					offlineUser: { id: profile.id },
				});
			}
		}

		socket.leave(profile.id);

		console.log(chalk.green("Left recent chats room"));
	} catch (error) {
		console.log(chalk.red("Error leaving recent chats room"));
		console.error(error);

		if (error instanceof Error) {
			socket.emit(events.socket.error, {
				message: error.message,
			});
		}

		socket.emit(events.socket.error, {
			message: "Error leaving recent chats room",
		});
	}
}
