import type { Socket, Server as SocketServer } from "socket.io";
import { default as events } from "../../events.js";
import type { JWTUserType } from "../../validators/auth.validators.js";
import {
	joinRecentChatsRoom,
	leaveRecentChatsRoom,
	recentChatsOnlineUsers,
	recieveRecentChatsGroupChats,
	recieveRecentChatsPrivateChats,
} from "../controllers/recent_chats.controllers.js";

export function useRecentChatsEvents(
	io: SocketServer,
	socket: Socket,
	user: JWTUserType,
) {
	socket.on(events.recentChats.room.join, async () => {
		joinRecentChatsRoom({ io, socket, user });
	});

	socket.on(events.recentChats.users.online, async (callback) => {
		recentChatsOnlineUsers({ io, socket, user }, callback);
	});

	socket.on(events.recentChats.privateChats.receive, async (callback) => {
		recieveRecentChatsPrivateChats({ io, socket, user }, callback);
	});

	socket.on(events.recentChats.groupChats.receive, async (callback) => {
		recieveRecentChatsGroupChats({ io, socket, user }, callback);
	});

	socket.on(events.recentChats.room.leave, async () => {
		leaveRecentChatsRoom({ io, socket, user });
	});
}
