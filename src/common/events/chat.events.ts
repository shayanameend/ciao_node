import type { Socket, Server as SocketServer } from "socket.io";
import { default as events } from "../../events.js";
import type { JWTUserType } from "../../validators/auth.validators.js";
import {
	joinChatRoom,
	leaveChatRoom,
} from "../controllers/chat.controllers.js";

export function useChatEvents(
	io: SocketServer,
	socket: Socket,
	user: JWTUserType,
) {
	socket.on(events.chat.room.join, ({ otherUserId }, callback) => {
		joinChatRoom({ io, socket, user }, { otherUserId }, callback);
	});

	socket.on(events.chat.room.leave, ({ roomId }) => {
		leaveChatRoom({ io, socket, user }, { roomId });
	});
}
