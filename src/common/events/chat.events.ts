import type { Socket, Server as SocketServer } from "socket.io";
import type { JWTUserType } from "../../validators/auth.validators.js";
import { default as events } from "../../events.js";
import { default as chalk } from "chalk";
import { joinChatRoom } from "../controllers/chat.controllers.js";

export function useChatEvents(
	io: SocketServer,
	socket: Socket,
	user: JWTUserType,
) {
	socket.on(events.chat.room.join, ({ otherUserId }, callback) => {
		joinChatRoom({ io, socket, user }, { otherUserId }, callback);
	});
}
