import type { NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import type { ExtendedRequest, ExtendedResponse } from "../types.js";
import { jwtUserSchema } from "../validators/auth.validators.js";

export function authenticate(role: "user" | "admin" = "user") {
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
