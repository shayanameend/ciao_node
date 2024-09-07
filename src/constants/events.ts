export default {
	socket: {
		connection: "connection",
		error: "error",
		disconnect: "disconnect",
	},
	recentChats: {
		room: {
			join: "recent_chats:room:join",
			leave: "recent_chats:room:leave",
		},
		users: {
			online: "recent_chats:users:online",
			offline: "recent_chats:users:offline",
		},
		privateChats: {
			receive: "recent_chats:private_chats:receive",
		},
		groupChats: {
			receive: "recent_chats:group_chats:receive",
		},
	},
	privateChat: {
		archive: "private_chat:archive",
		delete: "private_chat:delete",
		room: {
			create: "private_chat:room:create",
			join: "private_chat:room:join",
			leave: "private_chat:room:leave",
		},
		messages: {
			receive: "private_chat:messages:receive",
			read: "private_chat:messages:read",
			delete: "private_chat:messages:delete",
		},
		message: {
			send: "private_chat:message:send",
			receive: "private_chat:message:receive",
			read: "private_chat:message:read",
			edit: "private_chat:message:edit",
			delete: "private_chat:message:delete",
		},
	},
	groupChat: {
		join: "group_chat:join",
		leave: "group_chat:leave",
		archive: "group_chat:archive",
		delete: "group_chat:delete",
		room: {
			create: "group_chat:room:create",
			join: "group_chat:room:join",
			leave: "group_chat:room:leave",
		},
		messages: {
			receive: "group_chat:messages:receive",
			read: "group_chat:messages:read",
			delete: "group_chat:messages:delete",
		},
		message: {
			send: "group_chat:message:send",
			receive: "group_chat:message:receive",
			read: "group_chat:message:read",
			edit: "group_chat:message:edit",
			delete: "group_chat:message:delete",
		},
	},
};

// delete for every one
