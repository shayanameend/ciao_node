import type { Request, Response } from "express";
import type { JWTUserType } from "./validators/auth.validators.js";

export type Data =
	| null
	| number
	| string
	| boolean
	| Date
	| Data[]
	| { [key: string]: Data };

export enum OtpType {
	REGISTERATION = "registeration",
	FORGET_PASSWORD = "forget-password",
}

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
