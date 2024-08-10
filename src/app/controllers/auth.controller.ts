import argon from "argon2";
import jwt from "jsonwebtoken";
import { db } from "../../db.js";
import { env } from "../../env.js";
import {
	type ExtendedRequest,
	type ExtendedResponse,
	OtpType,
	TokenType,
} from "../../types.js";
import { sendEmail } from "../../utils/mail.js";
import { generateOTP } from "../../utils/otp.js";
import { getBodyForOTP } from "../../utils/templates.js";
import {
	changePasswordBodySchema,
	createProfileBodySchema,
	forgetPasswordBodySchema,
	loginUserBodySchema,
	registerUserBodySchema,
	resendOTPBodySchema,
	resetPasswordBodySchema,
	verifyOTPBodySchema,
} from "../../validators/auth.validators.js";

export async function register(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		const parsedBody = registerUserBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
		}

		const { email, password, role, deviceToken, deviceType } = parsedBody.data;

		const existingUser = await db.user.findUnique({
			where: {
				email,
			},
		});

		if (existingUser) {
			return res.badRequest?.({ message: "User already exists" });
		}

		const hashedPassword = await argon.hash(password);

		const user = await db.user.create({
			data: {
				email,
				password: hashedPassword,
				role,
			},
		});

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

		const otpCode = generateOTP(8);

		const otp = await db.otp.create({
			data: {
				code: otpCode,
				type: OtpType.REGISTRATION,
				user: {
					connect: {
						id: user.id,
					},
				},
			},
		});

		await sendEmail({
			name: "",
			email: user.email,
			body: getBodyForOTP(otp.code),
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

		return res.created?.({
			data: {
				user: {
					id: user.id,
					email: user.email,
				},
				token: jwtToken,
			},
			message: "User registered successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
	}
}

export async function resendOTP(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: "Unauthorized",
			});
		}

		const parsedBody = resendOTPBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
		}

		const { verificationType } = parsedBody.data;

		if (verificationType === OtpType.REGISTRATION) {
			const userAlreadyVerified = await db.user.findUnique({
				where: {
					id: req.user.id,
					isVerified: true,
				},
			});

			if (userAlreadyVerified) {
				return res.badRequest?.({
					message: "User already verified",
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

		await sendEmail({
			name: "",
			email: req.user.email,
			body: getBodyForOTP(otp.code),
		});

		return res.success?.({
			message: "OTP sent successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
	}
}

export async function verifyOTP(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: "Unauthorized",
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
					message: "User already verified",
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
			return res.notFound?.({ message: "Invalid OTP" });
		}

		if (otp.isUsed) {
			return res.badRequest?.({ message: "OTP already used" });
		}

		const isOTPExpired =
			new Date().getTime() - otp.updatedAt.getTime() > 5 * 60 * 1000; // 5 minutes

		if (isOTPExpired) {
			return res.badRequest?.({ message: "OTP expired" });
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
			message: "OTP verified successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
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
			message: "User not found",
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
		message: "Forget Password requested successfully",
	});
}

export async function resetPassword(
	req: ExtendedRequest,
	res: ExtendedResponse,
) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.FORGET_PASSWORD) {
			return res.unauthorized?.({
				message: "Unauthorized",
			});
		}

		const user = await db.user.findUnique({
			where: {
				id: req.user.id,
			},
		});

		if (!user) {
			return res.unauthorized?.({
				message: "User not found",
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
			message: "Password reseted successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
	}
}

export async function createProfile(
	req: ExtendedRequest,
	res: ExtendedResponse,
) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: "Unauthorized",
			});
		}

		const user = await db.user.findUnique({
			where: {
				id: req.user.id,
			},
		});

		if (!user) {
			return res.unauthorized?.({
				message: "User not found",
			});
		}

		if (!user?.isVerified) {
			return res.unauthorized?.({
				message: "User not verified",
			});
		}

		const existingProfile = await db.profile.findUnique({
			where: {
				userId: req.user.id,
			},
		});

		if (existingProfile) {
			return res.badRequest?.({ message: "Profile already exists" });
		}

		const parsedBody = createProfileBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
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
			message: "Profile created successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
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
			return res.notFound?.({ message: "User not found" });
		}

		const isPasswordValid = await argon.verify(user.password, password);

		if (!isPasswordValid) {
			return res.unauthorized?.({ message: "Invalid password" });
		}

		if (!user.isVerified) {
			return res.unauthorized?.({ message: "User not verified" });
		}

		if (!user.profile) {
			return res.unauthorized?.({ message: "Profile not found" });
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

		return res.success?.({
			data: {
				user: {
					id: user.id,
					email: user.email,
				},
				token: jwtToken,
			},
			message: "User logged in successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
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
			return res.notFound?.({ message: "Device not found" });
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
			message: "User logged out successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
	}
}

export async function changePassword(
	req: ExtendedRequest,
	res: ExtendedResponse,
) {
	try {
		if (!req.user || req.user.tokenType !== TokenType.VERIFICATION) {
			return res.unauthorized?.({
				message: "Unauthorized",
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
				message: "User not verified",
			});
		}

		if (!user?.profile) {
			return res.badRequest?.({ message: "Profile does not exist" });
		}

		const isPasswordValid = await argon.verify(user.password, oldPassword);

		if (!isPasswordValid) {
			return res.unauthorized?.({ message: "Invalid old password" });
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
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
	}
}
