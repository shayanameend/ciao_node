import type { Socket, Server as SocketServer } from "socket.io";
import { default as events } from "../../events.js";
import type { JWTUserType } from "../../validators/auth.validators.js";
import {
	joinRecentChatsRoom,
	leaveRecentChatsRoom,
} from "../controllers/recent_chats.controllers.js";

export function useRecentChatsEvents(
	io: SocketServer,
	socket: Socket,
	user: JWTUserType,
) {
	socket.on(events.recentChats.room.join, async () => {
		joinRecentChatsRoom({ io, socket, user });
	});

	socket.on(events.recentChats.room.leave, async () => {
		leaveRecentChatsRoom({ io, socket, user });
	});
}
