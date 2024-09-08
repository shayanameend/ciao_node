import { default as argon } from "argon2";
import { default as jwt } from "jsonwebtoken";
import { db } from "../lib/db.js";
import { env } from "../lib/env.js";
import { upsertDevice } from "../services/device.service.js";
import { signToken } from "../services/jwt.service.js";
import { createOtp } from "../services/otp.service.js";
import { hashPassword } from "../services/password.service.js";
import { createUser, getUserByEmail } from "../services/user.service.js";
import {
	type ExtendedRequest,
	type ExtendedResponse,
	OtpType,
	ResponseMessages,
	TokenType,
} from "../types/misc.js";
import { sendMail } from "../utils/mail.js";
import { generateOTP } from "../utils/otp.js";
import { generateBodyForOTP } from "../utils/templates.js";
import { validate } from "../utils/validation.js";
import {
	changePasswordBodySchema,
	createProfileBodySchema,
	forgetPasswordBodySchema,
	loginUserBodySchema,
	registerUserBodySchema,
	resendOTPBodySchema,
	resetPasswordBodySchema,
	verifyOTPBodySchema,
} from "../validators/auth.validator.js";

export async function register(req: ExtendedRequest, res: ExtendedResponse) {
	const { email, password, role, deviceToken, deviceType } = validate({
		schema: registerUserBodySchema,
		data: req.body,
	});

	const { user: existingUser } = await getUserByEmail({ email });

	if (existingUser) {
		return res.badRequest?.({
			message: ResponseMessages.USER_ALREADY_EXISTS,
		});
	}

	const { hashedPassword } = await hashPassword({ password });

	const { user } = await createUser({
		email,
		password: hashedPassword,
		role,
	});

	const { device } = await upsertDevice({
		user,
		devicePlatform: deviceType,
		deviceToken,
	});

	const otpCode = generateOTP(8);

	const { otp } = await createOtp({
		user,
		otpType: OtpType.REGISTRATION,
		otpCode,
	});

	await sendMail({
		to: user.email,
		subject: "Verify Your Email",
		body: generateBodyForOTP(otp.code),
	});

	const { token } = signToken({
		payload: {
			id: user.id,
			email: user.email,
			tokenType: TokenType.VERIFICATION,
			deviceToken: device.token,
			deviceType: device.os,
		},
	});

	return res.created?.({
		data: {
			user: {
				id: user.id,
				email: user.email,
			},
			token,
		},
		message: ResponseMessages.USER_REGISTERED_SUCCESSFULLY,
	});
}

export async function resendOTP(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: ResponseMessages.UNAUTHORIZED,
			});
		}

		const { verificationType } = validate({
			schema: resendOTPBodySchema,
			data: req.body,
		});

		if (verificationType === OtpType.REGISTRATION) {
			const userAlreadyVerified = await db.user.findUnique({
				where: {
					id: req.user.id,
					isVerified: true,
				},
			});

			if (userAlreadyVerified) {
				return res.badRequest?.({
					message: ResponseMessages.USER_ALREADY_VERIFIED,
				});
			}
		}

		const otpCode = generateOTP(8);

		const otp = await db.otp.upsert({
			where: {
				userId: req.user.id,
			},
			create: {
				code: otpCode,
				type: verificationType,
				user: {
					connect: {
						id: req.user.id,
					},
				},
			},
			update: {
				code: otpCode,
				isUsed: false,
			},
		});

		await sendMail({
			to: req.user.email,
			subject: "Verify Your Email",
			body: generateBodyForOTP(otp.code),
		});

		return res.success?.({
			message: ResponseMessages.OTP_SENT_SUCCESSFULLY,
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({
			message: ResponseMessages.SOMETHING_WENT_WRONG,
		});
	}
}

export async function verifyOTP(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: ResponseMessages.UNAUTHORIZED,
			});
		}

		const parsedBody = verifyOTPBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
		}

		const { otpCode, verificationType } = parsedBody.data;

		if (verificationType === OtpType.REGISTRATION) {
			const userAlreadyVerified = await db.user.findUnique({
				where: {
					id: req.user.id,
					isVerified: true,
				},
			});

			if (userAlreadyVerified) {
				return res.badRequest?.({
					message: ResponseMessages.USER_ALREADY_VERIFIED,
				});
			}
		}

		const otp = await db.otp.findFirst({
			where: {
				code: otpCode,
				type: verificationType,
				userId: req.user.id,
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		if (!otp) {
			return res.notFound?.({ message: ResponseMessages.INVALID_OTP });
		}

		if (otp.isUsed) {
			return res.badRequest?.({ message: ResponseMessages.OTP_ALREADY_USED });
		}

		const isOTPExpired =
			new Date().getTime() - otp.updatedAt.getTime() > 5 * 60 * 1000; // 5 minutes

		if (isOTPExpired) {
			return res.badRequest?.({ message: ResponseMessages.OTP_EXPIRED });
		}

		await db.otp.update({
			where: {
				id: otp.id,
			},
			data: {
				isUsed: true,
			},
		});

		await db.user.update({
			where: {
				id: req.user.id,
			},
			data: {
				isVerified: true,
			},
		});

		return res.success?.({
			message: ResponseMessages.OTP_VERIFIED_SUCCESSFULLY,
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({
			message: ResponseMessages.SOMETHING_WENT_WRONG,
		});
	}
}

export async function requestForgetPassword(
	req: ExtendedRequest,
	res: ExtendedResponse,
) {
	const parsedBody = forgetPasswordBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		return res.badRequest?.({ message: parsedBody.error.errors[0].message });
	}

	const { email, deviceToken, deviceType } = parsedBody.data;

	const user = await db.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		return res.badRequest?.({
			message: ResponseMessages.USER_NOT_FOUND,
		});
	}

	const device = await db.device.upsert({
		where: {
			token: deviceToken,
		},
		create: {
			token: deviceToken,
			os: deviceType,
			isActive: false,
			user: {
				connect: {
					id: user.id,
				},
			},
		},
		update: {
			isActive: false,
			user: {
				connect: {
					id: user.id,
				},
			},
		},
	});

	const jwtToken = jwt.sign(
		{
			id: user.id,
			email: user.email,
			tokenType: TokenType.FORGET_PASSWORD,
			deviceToken: device.token,
			deviceType: device.os,
		},
		env.JWT_SECRET,
	);

	return res.success?.({
		data: {
			user: {
				id: user.id,
				email: user.email,
			},
			token: jwtToken,
		},
		message: ResponseMessages.FORGET_PASSWORD_REQUESTED_SUCCESSFULLY,
	});
}

export async function resetPassword(
	req: ExtendedRequest,
	res: ExtendedResponse,
) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.FORGET_PASSWORD) {
			return res.unauthorized?.({
				message: ResponseMessages.UNAUTHORIZED,
			});
		}

		const user = await db.user.findUnique({
			where: {
				id: req.user.id,
			},
		});

		if (!user) {
			return res.unauthorized?.({
				message: ResponseMessages.USER_NOT_FOUND,
			});
		}

		const parsedBody = resetPasswordBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
		}

		const { newPassword } = parsedBody.data;

		const hashedPassword = await argon.hash(newPassword);

		await db.user.update({
			where: {
				id: req.user.id,
			},
			data: {
				password: hashedPassword,
			},
		});

		const jwtToken = jwt.sign(
			{
				id: user.id,
				email: user.email,
				tokenType: TokenType.VERIFICATION,
				deviceToken: req.user.deviceToken,
				deviceType: req.user.deviceType,
			},
			env.JWT_SECRET,
		);

		return res.success?.({
			data: {
				user: {
					id: user.id,
					email: user.email,
				},
				token: jwtToken,
			},
			message: ResponseMessages.PASSWORD_RESETED_SUCCESSFULLY,
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({
			message: ResponseMessages.SOMETHING_WENT_WRONG,
		});
	}
}

export async function createProfile(
	req: ExtendedRequest,
	res: ExtendedResponse,
) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: ResponseMessages.UNAUTHORIZED,
			});
		}

		const user = await db.user.findUnique({
			where: {
				id: req.user.id,
			},
		});

		if (!user) {
			return res.unauthorized?.({
				message: ResponseMessages.USER_NOT_FOUND,
			});
		}

		if (!user?.isVerified) {
			return res.unauthorized?.({
				message: ResponseMessages.USER_NOT_VERIFIED,
			});
		}

		const existingProfile = await db.profile.findUnique({
			where: {
				userId: req.user.id,
			},
		});

		if (existingProfile) {
			return res.badRequest?.({
				message: ResponseMessages.PROFILE_ALREADY_EXISTS,
			});
		}

		const parsedBody = createProfileBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({
				message: parsedBody.error.errors[0].message,
			});
		}

		const { fullName, dob } = parsedBody.data;

		const profile = await db.profile.create({
			data: {
				fullName,
				dob: new Date(dob),
				user: {
					connect: {
						id: req.user.id,
					},
				},
			},
		});

		return res.created?.({
			data: {
				profile,
			},
			message: ResponseMessages.PROFILE_CREATED_SUCCESSFULLY,
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({
			message: ResponseMessages.SOMETHING_WENT_WRONG,
		});
	}
}

export async function login(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		const parsedBody = loginUserBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
		}

		const { email, password, deviceToken, deviceType } = parsedBody.data;

		const user = await db.user.findUnique({
			where: {
				email,
			},
			include: {
				profile: true,
			},
		});

		if (!user) {
			return res.notFound?.({ message: ResponseMessages.USER_NOT_FOUND });
		}

		const isPasswordValid = await argon.verify(user.password, password);

		if (!isPasswordValid) {
			return res.unauthorized?.({
				message: ResponseMessages.INVALID_PASSWORD,
			});
		}

		const device = await db.device.upsert({
			where: {
				token: deviceToken,
			},
			create: {
				token: deviceToken,
				os: deviceType,
				user: {
					connect: {
						id: user.id,
					},
				},
			},
			update: {
				isActive: true,
				user: {
					connect: {
						id: user.id,
					},
				},
			},
		});

		const jwtToken = jwt.sign(
			{
				id: user.id,
				email: user.email,
				tokenType: TokenType.VERIFICATION,
				deviceToken: device.token,
				deviceType: device.os,
			},
			env.JWT_SECRET,
		);

		if (!user.isVerified) {
			const otpCode = generateOTP(8);

			const otp = await db.otp.upsert({
				where: {
					userId: user.id,
				},
				create: {
					code: otpCode,
					type: OtpType.REGISTRATION,
					user: {
						connect: {
							id: user.id,
						},
					},
				},
				update: {
					code: otpCode,
					isUsed: false,
				},
			});

			await sendMail({
				to: user.email,
				subject: "Verify Your Email",
				body: generateBodyForOTP(otp.code),
			});

			return res.unauthorized?.({
				data: {
					user: {
						id: user.id,
						email: user.email,
					},
					token: jwtToken,
				},
				message: ResponseMessages.USER_NOT_VERIFIED,
			});
		}

		if (!user.profile) {
			return res.unauthorized?.({
				data: {
					user: {
						id: user.id,
						email: user.email,
					},
					token: jwtToken,
				},
				message: ResponseMessages.PROFILE_NOT_FOUND,
			});
		}

		return res.success?.({
			data: {
				user: {
					id: user.id,
					email: user.email,
				},
				token: jwtToken,
			},
			message: ResponseMessages.USER_LOGGED_IN_SUCCESSFULLY,
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({
			message: ResponseMessages.SOMETHING_WENT_WRONG,
		});
	}
}

export async function logout(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: "Unauthorized",
			});
		}

		const { deviceToken } = req.user;

		const device = await db.device.findUnique({
			where: {
				token: deviceToken,
			},
		});

		if (!device) {
			return res.notFound?.({ message: ResponseMessages.DEVICE_NOT_FOUND });
		}

		await db.device.update({
			where: {
				token: deviceToken,
			},
			data: {
				isActive: false,
			},
		});

		return res.success?.({
			message: ResponseMessages.USER_LOGGED_OUT_SUCCESSFULLY,
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({
			message: ResponseMessages.SOMETHING_WENT_WRONG,
		});
	}
}

export async function changePassword(
	req: ExtendedRequest,
	res: ExtendedResponse,
) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: ResponseMessages.UNAUTHORIZED,
			});
		}

		const parsedBody = changePasswordBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
		}

		const { oldPassword, newPassword } = parsedBody.data;

		const user = await db.user.findUnique({
			where: {
				id: req.user.id,
			},
			include: {
				profile: true,
			},
		});

		if (!user?.isVerified) {
			return res.unauthorized?.({
				message: ResponseMessages.USER_NOT_VERIFIED,
			});
		}

		if (!user?.profile) {
			return res.badRequest?.({ message: ResponseMessages.PROFILE_NOT_FOUND });
		}

		const isPasswordValid = await argon.verify(user.password, oldPassword);

		if (!isPasswordValid) {
			return res.unauthorized?.({ message: ResponseMessages.INVALID_PASSWORD });
		}

		const hashedPassword = await argon.hash(newPassword);

		await db.user.update({
			where: {
				id: user.id,
			},
			data: {
				password: hashedPassword,
			},
		});

		return res.created?.({
			message: ResponseMessages.PASSWORD_CHANGED_SUCCESSFULLY,
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({
			message: ResponseMessages.SOMETHING_WENT_WRONG,
		});
	}
}
