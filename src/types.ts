import type { User } from "@prisma/client";
import type { Request, Response } from "express";

export type Data = number | string | boolean | Data[] | { [key: string]: Data };

export interface ExtendedRequest extends Request {
	user?: User;
}

export interface ExtendedResponse extends Response {
	success?: (data: Data, meta: { message?: string }) => void;
	created?: (data: Data, meta: { message?: string }) => void;
	noContent?: (meta: { message?: string }) => void;
	badRequest?: (meta: { message?: string }) => void;
	unauthorized?: (meta: { message?: string }) => void;
	notFound?: (meta: { message?: string }) => void;
	internalServerError?: (meta: { message?: string }) => void;
}
