import type { Socket, Server as SocketServer } from "socket.io";
import * as zod from "zod";
import { db } from "../db.js";
import {
	type MessageResponseType,
	messageResponseValidator,
} from "../validators/message.validator.js";

export function useMessageEvents(
	_io: SocketServer,
	socket: Socket,
	currentProfileId: string,
) {
	socket.on("get_all_messages", async (roomId: string) => {
		try {
			const messagesResponse: MessageResponseType[] = await db.message.findMany(
				{
					where: {
						roomId,
					},
					select: {
						id: true,
						text: true,
						updatedAt: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
			);

			const messages: MessageResponseType[] = zod
				.array(messageResponseValidator)
				.parse(messagesResponse);

			socket.emit("receive_all_messages", {
				data: {
					messages,
				},
			});
		} catch (error) {
			socket.emit("error", {
				error: {
					message: "Error getting messages!",
				},
			});
		}
	});

	socket.on("send_message", async (roomId: string, messageText: string) => {
		try {
			const newMessageResponse: MessageResponseType = await db.message.create({
				data: {
					profileId: currentProfileId,
					roomId,
					text: messageText,
				},
				select: {
					id: true,
					text: true,
					updatedAt: true,
				},
			});

			const newMessage: MessageResponseType =
				messageResponseValidator.parse(newMessageResponse);

			socket.emit("get_new_message", {
				data: {
					message: newMessage,
				},
			});
		} catch (error) {
			socket.emit("error", {
				error: {
					message: "Error sending message!",
				},
			});
		}
	});

	socket.on("edit_message", async (messageId: string, messageText: string) => {
		try {
			const updatedMessageResponse: MessageResponseType =
				await db.message.update({
					where: {
						id: messageId,
					},
					data: {
						text: messageText,
					},
					select: {
						id: true,
						text: true,
						updatedAt: true,
					},
				});

			const updatedMessage: MessageResponseType =
				messageResponseValidator.parse(updatedMessageResponse);

			socket.emit("get_updated_message", {
				data: {
					message: updatedMessage,
				},
			});
		} catch (error) {
			socket.emit("error", {
				error: {
					message: "Error editing message!",
				},
			});
		}
	});

	socket.on("read_message", async (messageId: string) => {
		try {
			const updatedMessageResponse: MessageResponseType =
				await db.message.update({
					where: {
						id: messageId,
					},
					data: {
						isRead: true,
						readTime: new Date(),
					},
					select: {
						id: true,
						text: true,
						updatedAt: true,
					},
				});

			const updatedMessage: MessageResponseType =
				messageResponseValidator.parse(updatedMessageResponse);

			socket.emit("get_read_message", {
				data: {
					message: updatedMessage,
				},
			});
		} catch (error) {
			socket.emit("error", {
				error: {
					message: "Error reading message!",
				},
			});
		}
	});
}
