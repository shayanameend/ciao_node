import argon from "argon2";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { env } from "../env.js";
import type { ExtendedRequest, ExtendedResponse } from "../types.js";
import {
	loginUserBodySchema,
	registerUserBodySchema,
} from "../validators/user.validator.js";

export async function register(req: ExtendedRequest, res: ExtendedResponse) {
	try {
		const parsedBody = registerUserBodySchema.safeParse(req.body);

		if (!parsedBody.success) {
			return res.badRequest?.({ message: parsedBody.error.errors[0].message });
		}

		const { email, password, deviceToken, deviceType } = parsedBody.data;

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

		const jwtToken = jwt.sign(
			{
				id: user.id,
				email: user.email,
				deviceToken: device.token,
				deviceType: device.os,
			},
			env.JWT_SECRET,
		);

		return res.created?.(
			{
				user: user,
				token: jwtToken,
			},
			{
				message: "User registered successfully",
			},
		);
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
		});

		if (!user) {
			return res.notFound?.({ message: "User not found" });
		}

		const isPasswordValid = await argon.verify(user.password, password);

		if (!isPasswordValid) {
			return res.unauthorized?.({ message: "Invalid password" });
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
				deviceToken: device.token,
				deviceType: device.os,
			},
			env.JWT_SECRET,
		);

		return res.success?.(
			{
				user: user,
				token: jwtToken,
			},
			{
				message: "User logged in successfully",
			},
		);
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
		if (!req.user) {
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

		return res.success?.(
			{},
			{
				message: "User logged out successfully",
			},
		);
	} catch (error) {
		console.error(error);

		if (error instanceof Error) {
			return res.internalServerError?.({ message: error.message });
		}

		return res.internalServerError?.({ message: "Something went wrong" });
	}
}
