import type { Socket, Server as SocketServer } from "socket.io";
import { default as events } from "../../events.js";
import type { JWTUserType } from "../../validators/auth.validators.js";
import {
	archiveGroupChatRoom,
	deleteGroupChatRoom,
	deleteGroupChatRoomMessage,
	deleteGroupChatRoomMessages,
	editGroupChatRoomMessage,
	joinGroupChatRoom,
	leaveGroupChatRoom,
	readGroupChatRoomMessage,
	readGroupChatRoomMessages,
	sendGroupChatRoomMessage,
} from "../controllers/group_chat.controllers.js";

export function useGroupChatEvents(
	io: SocketServer,
	socket: Socket,
	user: JWTUserType,
) {
	socket.on(events.groupChat.room.join, ({ otherUserId }, callback) => {
		joinGroupChatRoom({ io, socket, user }, { otherUserId }, callback);
	});

	socket.on(events.groupChat.messages.read, ({ roomId }) => {
		readGroupChatRoomMessages({ io, socket, user }, { roomId });
	});

	socket.on(events.groupChat.messages.delete, ({ roomId }) => {
		deleteGroupChatRoomMessages({ io, socket, user }, { roomId });
	});

	socket.on(events.groupChat.message.send, ({ roomId, text }) => {
		sendGroupChatRoomMessage({ io, socket, user }, { roomId, text });
	});

	socket.on(events.groupChat.message.read, ({ messageId }) => {
		readGroupChatRoomMessage({ io, socket, user }, { messageId });
	});

	socket.on(events.groupChat.message.edit, ({ messageId, newText }) => {
		editGroupChatRoomMessage({ io, socket, user }, { messageId, newText });
	});

	socket.on(events.groupChat.message.delete, ({ messageId }) => {
		deleteGroupChatRoomMessage({ io, socket, user }, { messageId });
	});

	socket.on(events.groupChat.room.leave, ({ roomId }) => {
		leaveGroupChatRoom({ io, socket, user }, { roomId });
	});

	socket.on(events.groupChat.archive, ({ roomId }) => {
		archiveGroupChatRoom({ io, socket, user }, { roomId });
	});

	socket.on(events.groupChat.delete, ({ roomId }) => {
		deleteGroupChatRoom({ io, socket, user }, { roomId });
	});
}
