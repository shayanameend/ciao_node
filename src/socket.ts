import { default as chalk } from "chalk";
import type { Socket, Server as SocketServer } from "socket.io";
import { useChatEvents } from "./common/events/private_chat.events.js";
import { default as events } from "./events.js";
import { jwtUserSchema } from "./validators/auth.validators.js";

export function useSocketIO(io: SocketServer, socket: Socket) {
	console.log(chalk.cyan(`User Connected: ${socket.id}`));

	const user = jwtUserSchema.safeParse(socket.data);

	if (!user.success) {
		console.log(chalk.red("Invalid Token"));
		return socket.emit(events.socket.error, "Invalid Token");
	}

	useChatEvents(io, socket, user.data);

	socket.on(events.socket.disconnect, () => {
		console.log(chalk.cyan(`User Disconnected: ${socket.id}`));
	});
}
