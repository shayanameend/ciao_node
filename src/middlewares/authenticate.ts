import type { NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import { env } from "../env.js";
import type { ExtendedRequest, ExtendedResponse } from "../types.js";
import { jwtUserSchema } from "../validators/auth.validators.js";

export function authenticateHttp(role: "user" | "admin" = "user") {
	return async (
		req: ExtendedRequest,
		res: ExtendedResponse,
		next: NextFunction,
	) => {
		const authorization = req.headers.authorization;
		if (!authorization) {
			return res.unauthorized?.({
				message: "Authorization header is required",
			});
		}

		const token = authorization.split(" ")[1];
		if (!token) {
			return res.unauthorized?.({ message: "Token is required" });
		}

		try {
			const decodedToken = jwt.verify(token, env.JWT_SECRET);

			const decodedJWTUser = jwtUserSchema.safeParse(decodedToken);

			if (!decodedJWTUser.success) {
				return res.unauthorized?.({ message: "Invalid token" });
			}

			req[role] = decodedJWTUser.data;
		} catch (error) {
			console.error(error);
		}

		next();
	};
}

export async function authenticateSocket(
	socket: Socket,
	next: (err?: Error) => void,
) {
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
}
