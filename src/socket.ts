import chalk from "chalk";
import type { Socket, Server as SocketServer } from "socket.io";

export function useSocketIO(io: SocketServer, socket: Socket) {
	console.log(chalk.cyan(`User Connected: ${socket.id}`));

	const userId = "";
	// useMessageEvents(io, socket, userId);

	socket.on("disconnect", () => {
		console.log(chalk.cyan(`User Disconnected: ${socket.id}`));
	});
}
