import type { Server as HttpServer } from "node:http";
import { createServer as createDevelopmentServer } from "node:http";
import { createServer as createProductionServer } from "node:https";
import { default as chalk } from "chalk";
import { default as cors } from "cors";
import { type Express, default as express } from "express";
import { default as morgan } from "morgan";
import type { Socket } from "socket.io";
import { Server as SocketServer } from "socket.io";
import { appRouter } from "./app.js";
import { default as events } from "./config/events.js";
import { env } from "./env.js";
import { authenticateSocket } from "./middlewares/authenticate.js";
import { responseHandler } from "./middlewares/response_handler.js";
import { useSocketIO } from "./socket.js";
import { NodeEnv } from "./types.js";

const app: Express = express();

let httpServer: HttpServer;

switch (env.NODE_ENV) {
	case NodeEnv.PRODUCTION:
		console.log(chalk.blue("Setting Up Production Https Server"));
		httpServer = createProductionServer(
			{
				cert: env.SSL_CERT,
				key: env.SSL_KEY,
			},
			app,
		);
		break;
	case NodeEnv.DEVELOPMENT:
		console.log(chalk.yellow("Setting Up Development Http Server"));
		httpServer = createDevelopmentServer(app);
		break;
}

console.log(chalk.blue("Setting Up Express App"));
app.use(
	cors({
		origin: "*",
	}),
);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(
	responseHandler({ debugLevel: env.NODE_ENV === NodeEnv.DEVELOPMENT ? 2 : 1 }),
);
app.use(appRouter);

console.log(chalk.blue("Setting Up Socket IO"));
export const io: SocketServer = new SocketServer(httpServer, {
	cors: {
		origin: "*",
	},
});

io.use(authenticateSocket);

io.on(events.socket.connection, (socket: Socket) => {
	useSocketIO(io, socket);
});

httpServer.listen(env.PORT, () => {
	console.log(
		chalk.blue(
			`Live on ${env.NODE_ENV === "production" ? "https" : "http"}://${env.HOST}:${env.PORT}`,
		),
	);
});
