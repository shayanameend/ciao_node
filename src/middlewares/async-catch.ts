import * as zod from "zod";
import {
	type ExtendedRequest,
	type ExtendedResponse,
	ResponseMessages,
} from "../types/misc.js";

export function asyncCatch(
	fn: (req: ExtendedRequest, res: ExtendedResponse) => Promise<void>,
) {
	return (req: ExtendedRequest, res: ExtendedResponse) => {
		try {
			fn(req, res);
		} catch (error) {
			console.error(error);

			if (error instanceof zod.ZodError) {
				return res.badRequest?.({ message: error.errors[0].message });
			}

			if (error instanceof Error) {
				return res.internalServerError?.({ message: error.message });
			}

			return res.internalServerError?.({
				message: ResponseMessages.SOMETHING_WENT_WRONG,
			});
		}
	};
}
