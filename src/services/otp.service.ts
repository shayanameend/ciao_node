import { db } from "../lib/db.js";
import type { Otp, User } from "../types/db.js";
import type { OtpType } from "../types/misc.js";

interface CreateOtpProps {
	user: User;
	otpType: OtpType;
	otpCode: string;
}

interface CreateOtpReturns {
	otp: Otp;
}

export async function createOtp({
	user,
	otpType,
	otpCode,
}: CreateOtpProps): Promise<CreateOtpReturns> {
	const otp = await db.otp.create({
		data: {
			code: otpCode,
			type: otpType,
			user: {
				connect: {
					id: user.id,
				},
			},
		},
	});

	return { otp };
}
