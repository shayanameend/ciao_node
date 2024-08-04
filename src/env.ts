import * as zod from "zod";

export const envSchema = zod.object({
	NODE_ENV: zod
		.enum(["development", "production"], {
			message: "Valid NODE_ENV is Required",
		})
		.default("development"),
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
