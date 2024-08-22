import type { Request, Response } from "express";
import type { JWTUserType } from "./validators/auth.validators.js";
import type { Socket, Server as SocketServer } from "socket.io";

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

export enum OsType {
	ANDROID = "android",
	IOS = "ios",
}

export enum Roles {
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
