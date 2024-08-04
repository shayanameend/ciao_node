import chalk from "chalk";
import type { NextFunction } from "express";
import type { ExtendedRequest, ExtendedResponse } from "../types.js";

export function responseHandler({ debugLevel }: { debugLevel: 0 | 1 | 2 | 3 }) {
	return async (
		req: ExtendedRequest,
		res: ExtendedResponse,
		next: NextFunction,
	) => {
		res.success = ({ data = {}, message = "Success!" }) => {
			debugLevel > 2 && console.log(chalk.green(JSON.stringify(req.body)));
			debugLevel > 0 && console.log(chalk.green(message));
			debugLevel > 1 && console.log(chalk.green(JSON.stringify(data)));

			res.status(200).json({
				data,
				meta: { message, status: 200 },
			});
		};

		res.created = ({ data = {}, message = "Created!" }) => {
			debugLevel > 2 && console.log(chalk.green(JSON.stringify(req.body)));
			debugLevel > 0 && console.log(chalk.green(message));
			debugLevel > 1 && console.log(chalk.green(JSON.stringify(data)));

			res.status(201).json({
				data,
				meta: { message, status: 201 },
			});
		};

		res.noContent = ({ data = {}, message = "No Content!" }) => {
			debugLevel > 2 && console.log(chalk.green(JSON.stringify(req.body)));
			debugLevel > 0 && console.log(chalk.green(message));
			debugLevel > 1 && console.log(chalk.green(JSON.stringify(data)));

			res.status(204).json({
				data,
				meta: { message, status: 204 },
			});
		};

		res.badRequest = ({ data = {}, message = "Bad Request!" }) => {
			debugLevel > 2 && console.log(chalk.red(JSON.stringify(req.body)));
			debugLevel > 0 && console.log(chalk.red(message));
			debugLevel > 1 && console.log(chalk.red(JSON.stringify(data)));

			res.status(400).json({
				data,
				meta: { message, status: 400 },
			});
		};

		res.unauthorized = ({ data = {}, message = "Unauthorized!" }) => {
			debugLevel > 2 && console.log(chalk.red(JSON.stringify(req.body)));
			debugLevel > 0 && console.log(chalk.red(message));
			debugLevel > 1 && console.log(chalk.red(JSON.stringify(data)));

			res.status(401).json({
				data,
				meta: { message, status: 401 },
			});
		};

		res.notFound = ({ data = {}, message = "Not Found!" }) => {
			debugLevel > 2 && console.log(chalk.red(JSON.stringify(req.body)));
			debugLevel > 0 && console.log(chalk.red(message));
			debugLevel > 1 && console.log(chalk.red(JSON.stringify(data)));

			res.status(404).json({
				data,
				meta: { message, status: 404 },
			});
		};

		res.internalServerError = ({
			data = {},
			message = "Internal Server Error!",
		}) => {
			debugLevel > 2 && console.log(chalk.red(JSON.stringify(req.body)));
			debugLevel > 0 && console.log(chalk.red(message));
			debugLevel > 1 && console.log(chalk.red(JSON.stringify(data)));

			res.status(500).json({
				data,
				meta: { message, status: 500 },
			});
		};

		next();
	};
}
