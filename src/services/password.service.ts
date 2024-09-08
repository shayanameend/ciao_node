import { default as argon } from "argon2";

interface HashPasswordProps {
	password: string;
}

interface HashPasswordReturns {
	hashedPassword: string;
}

export async function hashPassword({
	password,
}: HashPasswordProps): Promise<HashPasswordReturns> {
	const hashedPassword = await argon.hash(password);

	return { hashedPassword };
}
