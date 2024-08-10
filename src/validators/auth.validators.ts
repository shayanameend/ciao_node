import * as zod from "zod";
import { OtpType } from "../types.js";

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
	role: zod.enum(["user", "admin"], {
		message: "Only user and admin roles are supported",
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

export const resendOTPBodySchema = zod.object({
	verificationType: zod.enum([OtpType.REGISTRATION, OtpType.FORGET_PASSWORD], {
		message:
			"Only registeration and forgotPassword verification types are supported",
	}),
});

export const verifyOTPBodySchema = zod.object({
	otpCode: zod.string({
		message: "OTP is required",
	}),
	verificationType: zod.enum([OtpType.REGISTRATION, OtpType.FORGET_PASSWORD], {
		message:
			"Only registeration and forgotPassword verification types are supported",
	}),
});

export const forgetPasswordBodySchema = zod.object({
	email: zod
		.string({
			message: "Email is required",
		})
		.email({
			message: "Invalid email",
		}),
});

export const createProfileBodySchema = zod.object({
	fullName: zod.string({
		message: "Full name is required",
	}),
	dob: zod.string({
		message: "Date of birth is required",
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

export const changePasswordBodySchema = zod.object({
	oldPassword: zod
		.string({
			message: "Old Password is required",
		})
		.min(8, {
			message: "Old Password should be at least 8 characters",
		})
		.max(16, {
			message: "Old Password should be at most 16 characters",
		}),
	newPassword: zod
		.string({
			message: "New Password is required",
		})
		.min(8, {
			message: "New Password should be at least 8 characters",
		})
		.max(16, {
			message: "New Password should be at most 16 characters",
		}),
});

export type JWTUserType = zod.infer<typeof jwtUserSchema>;
export type RegisterUserBodyType = zod.infer<typeof registerUserBodySchema>;
export type ResendOTPBodyType = zod.infer<typeof resendOTPBodySchema>;
export type VerifyOTPBodyType = zod.infer<typeof verifyOTPBodySchema>;
export type LoginUserBodyType = zod.infer<typeof loginUserBodySchema>;
