import { parse } from "cookie";
import type { NextFunction } from "express";
import { default as jwt } from "jsonwebtoken";
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

		const parsedToken = authorization.split(" ")[1];

		if (!parsedToken) {
			return res.unauthorized?.({ message: "Token is required" });
		}

		try {
			const decodedToken = jwt.verify(parsedToken, env.JWT_SECRET);

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
	const cookieHeader = socket.handshake.headers.cookie || "";

	const cookies = parse(cookieHeader);

	const token = cookies.token;

	if (!token) {
		return next(new Error("Token is required"));
	}

	const parsedToken = token.split(" ")[1];

	if (!parsedToken) {
		return next(new Error("Token is required"));
	}

	try {
		const decodedToken = jwt.verify(token, env.JWT_SECRET);

		const decodedJWTUser = jwtUserSchema.safeParse(decodedToken);

		if (!decodedJWTUser.success) {
			return next(new Error("Invalid token"));
		}

		socket.data = decodedJWTUser.data;

		next();
	} catch (error) {
		console.error(error);

		next(new Error("Invalid token"));
	}
}
