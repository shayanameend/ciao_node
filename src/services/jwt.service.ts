import { default as jwt } from "jsonwebtoken";
import { env } from "../lib/env.js";

interface SignTokenProps {
	payload: Record<string, unknown>;
}

interface SignTokenReturns {
	token: string;
}

export function signToken({ payload }: SignTokenProps): SignTokenReturns {
	const token = jwt.sign(payload, env.JWT_SECRET, {
		expiresIn: env.JWT_ACCESS_EXPIRATION_MINUTES * 60,
	});

	return { token };
}
