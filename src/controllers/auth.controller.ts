import type { ExtendedRequest, ExtendedResponse } from "../types.js";

export function login(_req: ExtendedRequest, res: ExtendedResponse) {
	res.success?.({}, { message: "logged in" });
}

export function register(_req: ExtendedRequest, res: ExtendedResponse) {
	res.created?.({}, { message: "registered" });
}
