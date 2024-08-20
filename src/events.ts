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
			delete: "group:messages:delete",
		},
	},
	chat: {
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
			delete: "chat:messages:delete",
		},
	},
};
