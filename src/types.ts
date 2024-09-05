import type { Request, Response } from "express";
import type { Socket, Server as SocketServer } from "socket.io";
import type { JWTUserType } from "./validators/auth.validators.js";

export enum NodeEnv {
	DEVELOPMENT = "development",
	PRODUCTION = "production",
}

export enum TokenType {
	VERIFICATION = "verification",
	FORGET_PASSWORD = "forget-password",
}

export enum OtpType {
	REGISTRATION = "registration",
	FORGET_PASSWORD = "forget-password",
}

export enum Platform {
	ANDROID = "android",
	IOS = "ios",
	LINUX = "linux",
	MACOS = "macos",
	WINDOWS = "windows",
	WEB = "web",
}

export enum Role {
	ADMIN = "admin",
	USER = "user",
}

export type Data =
	| null
	| number
	| string
	| boolean
	| Date
	| Data[]
	| { [key: string]: Data };

export interface ExtendedRequest extends Request {
	user?: JWTUserType;
	admin?: JWTUserType;
}

export interface ExtendedResponse extends Response {
	success?: (init: { data?: Data; message?: string }) => void;
	created?: (init: { data?: Data; message?: string }) => void;
	noContent?: (init: { data?: Data; message?: string }) => void;
	badRequest?: (init: { data?: Data; message?: string }) => void;
	unauthorized?: (init: { data?: Data; message?: string }) => void;
	notFound?: (init: { data?: Data; message?: string }) => void;
	internalServerError?: (init: { data?: Data; message?: string }) => void;
}

export interface SocketParams {
	io: SocketServer;
	socket: Socket;
	user: JWTUserType;
}

export enum ResponseMessages {
	DEVICE_NOT_FOUND = "Device not found",
	FORGET_PASSWORD_REQUESTED_SUCCESSFULLY = "Forget Password requested successfully",
	INVALID_OTP = "Invalid OTP",
	INVALID_PASSWORD = "Invalid password",
	OTP_ALREADY_USED = "OTP already used",
	OTP_EXPIRED = "OTP expired",
	OTP_SENT_SUCCESSFULLY = "OTP sent successfully",
	OTP_VERIFIED_SUCCESSFULLY = "OTP verified successfully",
	PASSWORD_CHANGED_SUCCESSFULLY = "Password changed successfully",
	PASSWORD_RESETED_SUCCESSFULLY = "Password reseted successfully",
	PROFILE_ALREADY_EXISTS = "Profile already exists",
	PROFILE_CREATED_SUCCESSFULLY = "Profile created successfully",
	PROFILE_NOT_FOUND = "Profile not found",
	SOMETHING_WENT_WRONG = "Something went wrong",
	UNAUTHORIZED = "Unauthorized",
	USER_ALREADY_EXISTS = "User already exists",
	USER_ALREADY_VERIFIED = "User already verified",
	USER_LOGGED_IN_SUCCESSFULLY = "User logged in successfully",
	USER_LOGGED_OUT_SUCCESSFULLY = "User logged out successfully",
	USER_NOT_FOUND = "User not found",
	USER_NOT_VERIFIED = "User not verified",
	USER_REGISTERED_SUCCESSFULLY = "User registered successfully",
	USERS_FETCHED_SUCCESSFULLY = "Users fetched successfully",
}
