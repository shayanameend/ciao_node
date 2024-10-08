import * as zod from "zod";
import { NodeEnv } from "../types/misc.js";

export const envSchema = zod
	.object({
		NAME: zod
			.string({
				message: "Valid Name is Required",
			})
			.default("Node Backend"),
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
		PORT: zod.coerce
			.number({
				message: "Valid Port is Required",
			})
			.default(3000),
		DATABASE_URL: zod
			.string({
				message: "Valid Database URL is Required",
			})
			.url({
				message: "Valid Database URL is Required",
			})
			.default("file:../db/dev.db"),
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
		SSL_CA: zod
			.string({
				message: "Valid SSL CA is Required",
			})
			.optional(),
		JWT_SECRET: zod
			.string({
				message: "Valid JWT Secret is Required",
			})
			.default("secret"),
		JWT_ACCESS_EXPIRATION_MINUTES: zod.coerce
			.number({
				message: "Valid JWT Access Expiration is Required",
			})
			.default(30),
		JWT_REFRESH_EXPIRATION_DAYS: zod.coerce
			.number({
				message: "Valid JWT Refresh Expiration is Required",
			})
			.default(30),
		JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: zod.coerce
			.number({
				message: "Valid JWT Verify Email Expiration is Required",
			})
			.default(1),
		JWT_RESET_PASSWORD_EXPIRATION_MINUTES: zod.coerce
			.number({
				message: "Valid JWT Reset Password Expiration is Required",
			})
			.default(1),
		SMTP_HOST: zod.string({
			message: "Valid SMTP Host is Required",
		}),
		SMTP_PORT: zod.coerce.number({
			message: "Valid SMTP Port is Required",
		}),
		SMTP_USERNAME: zod.string({
			message: "Valid SMTP Username is Required",
		}),
		SMTP_PASSWORD: zod.string({
			message: "Valid SMTP Password is Required",
		}),
		ADMIN_EMAIL: zod
			.string({
				message: "Valid Email From is Required",
			})
			.email({
				message: "Valid Email From is Required",
			}),
	})
	.refine(
		(data) => {
			if (data.NODE_ENV === NodeEnv.PRODUCTION) {
				return !!data.SSL_CERT && !!data.SSL_KEY && !!data.SSL_CA;
			}

			return true;
		},
		{
			message: "SSL_CERT, SSL_KEY, and SSL_CA are required in production",
			path: ["SSL_CERT", "SSL_KEY", "SSL_CA"],
		},
	);

export type Env = zod.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
