import { db } from "../lib/db.js";
import type { User } from "../types/db.js";
import type { Role } from "../types/misc.js";

interface GetUserByEmailProps {
	email: string;
}

interface GetUserByEmailReturns {
	user: User | null;
}

export async function getUserByEmail({
	email,
}: GetUserByEmailProps): Promise<GetUserByEmailReturns> {
	const user = await db.user.findUnique({
		where: {
			email,
		},
	});

	return { user };
}

interface CreateUserProps {
	email: string;
	password: string;
	role: Role;
}

interface CreateUserReturns {
	user: User;
}

export async function createUser({
	email,
	password,
	role,
}: CreateUserProps): Promise<CreateUserReturns> {
	const user = await db.user.create({
		data: {
			email,
			password,
			role,
		},
	});

	return { user };
}
