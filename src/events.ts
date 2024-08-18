export default {
	socket: {
		connection: "connection",
		error: "error",
		disconnect: "disconnect",
	},
	group: {
		create: "group:create",
		join: "group:join",
		leave: "group:leave",
		hide: "group:hide",
		archive: "group:archive",
		delete: "group:delete",
		room: {
			join: "group:room:join",
			leave: "group:room:leave",
		},
		message: {
			send: "group:message:send",
			receive: "group:message:receive",
			read: "group:message:read",
			edit: "group:message:edit",
			delete: "group:message:delete",
		},
		messages: {
			receive: "group:messages:receive",
			read: "group:messages:read",
		},
	},
	chat: {
		hide: "chat:hide",
		archive: "chat:archive",
		delete: "chat:delete",
		room: {
			join: "chat:room:join",
			leave: "chat:room:leave",
		},
		message: {
			send: "chat:message:send",
			receive: "chat:message:receive",
			read: "chat:message:read",
			edit: "chat:message:edit",
			delete: "chat:message:delete",
		},
		messages: {
			receive: "chat:messages:receive",
			read: "chat:messages:read",
		},
	},
	supportChat: {
		hide: "support_chat:hide",
		archive: "support_chat:archive",
		delete: "support_chat:delete",
		room: {
			join: "support_chat:room:join",
			leave: "support_chat:room:leave",
		},
		message: {
			send: "support_chat:message:send",
			receive: "support_chat:message:receive",
			read: "support_chat:message:read",
			edit: "support_chat:message:edit",
			delete: "support_chat:message:delete",
		},
		messages: {
			receive: "support_chat:messages:receive",
			read: "support_chat:messages:read",
		},
	},
};
