import { default as chalk } from "chalk";
import type { Socket, Server as SocketServer } from "socket.io";
import { default as events } from "../constants/events.js";
import { jwtUserSchema } from "../validators/auth.validator.js";

export function useSocketIO(_io: SocketServer, socket: Socket) {
	console.log(chalk.cyan(`User Connected: ${socket.id}`));

	const user = jwtUserSchema.safeParse(socket.data);

	if (!user.success) {
		console.log(chalk.red("Invalid Token"));
		return socket.emit(events.socket.error, "Invalid Token");
	}

	socket.on(events.socket.disconnect, () => {
		console.log(chalk.cyan(`User Disconnected: ${socket.id}`));
	});
}
