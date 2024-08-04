import { db } from "../db.js";
import type { ExtendedRequest, ExtendedResponse } from "../types.js";

export async function getAllUsers(
	_req: ExtendedRequest,
	res: ExtendedResponse,
) {
	try {
		const users = await db.user.findMany({
			select: {
				id: true,
				email: true,
				role: true,
				createdAt: true,
				profile: true,
				devices: {
					select: {
						id: true,
						os: true,
						isActive: true,
						createdAt: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return res.success?.({
			data: { users },
			message: "Users fetched successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
	}
}
