import type { Server as HttpServer } from "node:http";
import { createServer as createDevelopmentServer } from "node:http";
import { createServer as createProductionServer } from "node:https";
import chalk from "chalk";
import cors from "cors";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import type { Socket } from "socket.io";
import { Server as SocketServer } from "socket.io";
import { appRouter } from "./app.js";
import { env } from "./env.js";
import { responseHandler } from "./middlewares/response_handler.js";
import { useSocketIO } from "./socket.js";
import { jwtUserSchema } from "./validators/auth.validators.js";

const app: Express = express();

let httpServer: HttpServer;

switch (env.NODE_ENV) {
	case "development":
		console.log(chalk.yellow("Setting Up Development Http Server"));
		httpServer = createDevelopmentServer(app);
		break;
	case "production":
		console.log(chalk.blue("Setting Up Production Https Server"));
		httpServer = createProductionServer(
			{
				cert: env.SSL_CERT,
				key: env.SSL_KEY,
			},
			app,
		);
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
app.use(responseHandler({ debugLevel: 1 }));
app.use(appRouter);

console.log(chalk.blue("Setting Up Socket IO"));
export const io: SocketServer = new SocketServer(httpServer, {
	cors: {
		origin: "*",
	},
});

io.use((socket, next) => {
	const authorization = socket.handshake.auth.authorization;
	if (!authorization) {
		return next(new Error("Authorization header is required"));
	}

	const token = authorization.split(" ")[1];
	if (!token) {
		return next(new Error("Token is required"));
	}

	try {
		const decodedToken = jwt.verify(token, env.JWT_SECRET);

		const decodedJWTUser = jwtUserSchema.safeParse(decodedToken);

		if (!decodedJWTUser.success) {
			return next(new Error("Invalid token"));
		}

		socket.data = decodedJWTUser.data;
	} catch (error) {
		console.error(error);
	}

	next();
});

io.on("connection", (socket: Socket) => {
	useSocketIO(io, socket);
});

httpServer.listen(env.PORT, () => {
	console.log(
		chalk.blue(
			`Live on ${env.NODE_ENV === "production" ? "https" : "http"}://${env.HOST}:${env.PORT}`,
		),
	);
});
