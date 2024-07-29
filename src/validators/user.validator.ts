import * as zod from "zod";

export const registerUserBodySchema = zod.object({
	email: zod
		.string({
			message: "Email is required",
		})
		.email({
			message: "Invalid email",
		}),
	password: zod
		.string({
			message: "Password is required",
		})
		.min(8, {
			message: "Password should be at least 8 characters",
		})
		.max(16, {
			message: "Password should be at most 16 characters",
		}),
	deviceToken: zod
		.string({
			message: "Device token is required",
		})
		.min(1, {
			message: "Device should be at least 1 character",
		}),
	deviceType: zod.enum(["android", "ios"], {
		message: "Only Android and iOS devices are supported",
	}),
});

export const loginUserBodySchema = zod.object({
	email: zod
		.string({
			message: "Email is required",
		})
		.email({
			message: "Invalid email",
		}),
	password: zod
		.string({
			message: "Password is required",
		})
		.min(8, {
			message: "Password should be at least 8 characters",
		})
		.max(16, {
			message: "Password should be at most 16 characters",
		}),
	deviceToken: zod
		.string({
			message: "Device token is required",
		})
		.min(1, {
			message: "Device should be at least 1 character",
		}),
	deviceType: zod.enum(["android", "ios"], {
		message: "Only Android and iOS devices are supported",
	}),
});

export const jwtUserSchema = zod.object({
	id: zod
		.string({
			message: "ID is required",
		})
		.min(1, {
			message: "ID should be at least 1 character",
		}),
	email: zod
		.string({
			message: "Email is required",
		})
		.email({
			message: "Invalid email",
		}),
	deviceToken: zod
		.string({
			message: "Device token is required",
		})
		.min(1, {
			message: "Device should be at least 1 character",
		}),
	deviceType: zod.enum(["android", "ios"], {
		message: "Only Android and iOS devices are supported",
	}),
});

export type RegisterUserBodyType = zod.infer<typeof registerUserBodySchema>;
export type LoginUserBodyType = zod.infer<typeof loginUserBodySchema>;
export type JWTUserType = zod.infer<typeof jwtUserSchema>;