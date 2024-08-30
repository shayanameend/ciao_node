import type { Socket, Server as SocketServer } from "socket.io";
import { default as events } from "../../events.js";
import type { JWTUserType } from "../../validators/auth.validators.js";
import {
	archivePrivateChatRoom,
	deletePrivateChatRoom,
	deletePrivateChatRoomMessage,
	deletePrivateChatRoomMessages,
	editPrivateChatRoomMessage,
	joinPrivateChatRoom,
	leavePrivateChatRoom,
	readPrivateChatRoomMessage,
	readPrivateChatRoomMessages,
	sendPrivateChatRoomMessage,
} from "../controllers/private_chat.controllers.js";

export function usePrivateChatEvents(
	io: SocketServer,
	socket: Socket,
	user: JWTUserType,
) {
	socket.on(events.privateChat.room.join, ({ roomId }, callback) => {
		joinPrivateChatRoom({ io, socket, user }, { roomId }, callback);
	});

	socket.on(events.privateChat.messages.read, ({ roomId }) => {
		readPrivateChatRoomMessages({ io, socket, user }, { roomId });
	});

	socket.on(events.privateChat.messages.delete, ({ roomId }) => {
		deletePrivateChatRoomMessages({ io, socket, user }, { roomId });
	});

	socket.on(events.privateChat.message.send, ({ roomId, text }) => {
		sendPrivateChatRoomMessage({ io, socket, user }, { roomId, text });
	});

	socket.on(events.privateChat.message.read, ({ messageId }) => {
		readPrivateChatRoomMessage({ io, socket, user }, { messageId });
	});

	socket.on(events.privateChat.message.edit, ({ messageId, newText }) => {
		editPrivateChatRoomMessage({ io, socket, user }, { messageId, newText });
	});

	socket.on(events.privateChat.message.delete, ({ messageId }) => {
		deletePrivateChatRoomMessage({ io, socket, user }, { messageId });
	});

	socket.on(events.privateChat.room.leave, ({ roomId }) => {
		leavePrivateChatRoom({ io, socket, user }, { roomId });
	});

	socket.on(events.privateChat.archive, ({ roomId }) => {
		archivePrivateChatRoom({ io, socket, user }, { roomId });
	});

	socket.on(events.privateChat.delete, ({ roomId }) => {
		deletePrivateChatRoom({ io, socket, user }, { roomId });
	});
}
