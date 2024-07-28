import type { NextFunction } from "express";
import type { ExtendedRequest, ExtendedResponse } from "../types.js";

export function extendResponse(
	_req: ExtendedRequest,
	res: ExtendedResponse,
	next: NextFunction,
) {
	res.success = (data, { message = "Success!" }) => {
		res.status(200).json({
			data,
			message,
			status: 200,
		});
	};

	res.created = (data, { message = "Created!" }) => {
		res.status(201).json({
			data,
			message,
			status: 201,
		});
	};

	res.noContent = ({ message = "No Content!" }) => {
		res.status(204).json({
			message,
			status: 204,
		});
	};

	res.badRequest = ({ message = "Bad Request!" }) => {
		res.status(400).json({
			message,
			status: 400,
		});
	};

	res.unauthorized = ({ message = "Unauthorized!" }) => {
		res.status(401).json({
			message,
			status: 401,
		});
	};

	res.notFound = ({ message = "Not Found!" }) => {
		res.status(404).json({
			message,
			status: 404,
		});
	};

	res.internalServerError = ({ message = "Internal Server Error!" }) => {
		res.status(500).json({
			message,
			status: 500,
		});
	};

	next();
}
