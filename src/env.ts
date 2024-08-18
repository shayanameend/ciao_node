import * as zod from "zod";
import { NodeEnv } from "./types.js";

export const envSchema = zod.object({
	NODE_ENV: zod
		.enum([NodeEnv.DEVELOPMENT, NodeEnv.PRODUCTION], {
			message: "Valid NODE_ENV is Required",
		})
		.default(NodeEnv.DEVELOPMENT),
	HOST: zod
		.string({
			message: "Valid Host is Required",
		})
		.default("localhost"),
	PORT: zod
		.string({
			message: "Valid Port is Required",
		})
		.default("3000"),
	DATABASE_URL: zod
		.string({
			message: "Valid Database URL is Required",
		})
		.url({
			message: "Valid Database URL is Required",
		})
		.default("file:../db/dev.db"),
	JWT_SECRET: zod
		.string({
			message: "Valid JWT Secret is Required",
		})
		.default("secret"),
	COURIER_AUTH_TOKEN: zod.string({
		message: "Valid Courier Client Token is Required",
	}),
	SSL_CERT: zod
		.string({
			message: "Valid SSL Certificate",
		})
		.optional(),
	SSL_KEY: zod
		.string({
			message: "Valid SSL Key is Required",
		})
		.optional(),
});

export type Env = zod.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
