import { type ColorName, default as chalk } from "chalk";
import type { NextFunction } from "express";
import type { Data, ExtendedRequest, ExtendedResponse } from "../types.js";

export function responseHandler({ debugLevel }: { debugLevel: 0 | 1 | 2 | 3 }) {
	return async (
		req: ExtendedRequest,
		res: ExtendedResponse,
		next: NextFunction,
	) => {
		res.success = ({ data = {}, message = "Success!" }) => {
			debugHandler({
				debugLevel,
				color: "green",
				body: req.body,
				message,
				data,
			});

			res.status(200).json({
				data,
				meta: { message, status: 200 },
			});
		};

		res.created = ({ data = {}, message = "Created!" }) => {
			debugHandler({
				debugLevel,
				color: "green",
				body: req.body,
				message,
				data,
			});

			res.status(201).json({
				data,
				meta: { message, status: 201 },
			});
		};

		res.noContent = ({ data = {}, message = "No Content!" }) => {
			debugHandler({
				debugLevel,
				color: "green",
				body: req.body,
				message,
				data,
			});

			res.status(204).json({
				data,
				meta: { message, status: 204 },
			});
		};

		res.badRequest = ({ data = {}, message = "Bad Request!" }) => {
			debugHandler({
				debugLevel,
				color: "red",
				body: req.body,
				message,
				data,
			});

			res.status(400).json({
				data,
				meta: { message, status: 400 },
			});
		};

		res.unauthorized = ({ data = {}, message = "Unauthorized!" }) => {
			debugHandler({
				debugLevel,
				color: "red",
				body: req.body,
				message,
				data,
			});

			res.status(401).json({
				data,
				meta: { message, status: 401 },
			});
		};

		res.notFound = ({ data = {}, message = "Not Found!" }) => {
			debugHandler({
				debugLevel,
				color: "red",
				body: req.body,
				message,
				data,
			});

			res.status(404).json({
				data,
				meta: { message, status: 404 },
			});
		};

		res.internalServerError = ({
			data = {},
			message = "Internal Server Error!",
		}) => {
			debugHandler({
				debugLevel,
				color: "red",
				body: req.body,
				message,
				data,
			});

			res.status(500).json({
				data,
				meta: { message, status: 500 },
			});
		};

		next();
	};
}

function debugHandler({
	debugLevel,
	color,
	body,
	message,
	data,
}: {
	debugLevel: 0 | 1 | 2 | 3;
	color: ColorName;
	body: ExtendedRequest["body"];
	message: string;
	data: Data;
}) {
	debugLevel > 2 && console.log(chalk[color](JSON.stringify(body)));
	debugLevel > 0 && console.log(chalk[color](message));
	debugLevel > 1 && console.log(chalk[color](JSON.stringify(data)));
}
