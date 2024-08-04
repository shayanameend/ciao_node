import argon from "argon2";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { env } from "../env.js";
import type { ExtendedRequest, ExtendedResponse } from "../types.js";
import {
  registerUserBodySchema,
  resendOTPBodySchema,
  verifyOTPBodySchema,
  loginUserBodySchema,
} from "../validators/user.validator.js";
import { generateOTP } from "../utils/otp.js";
import { sendEmail } from "../utils/mail.js";
import { getBodyForOTP } from "../utils/templates.js";

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
        type: "registeration",
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
          deviceToken: device.token,
          deviceType: device.os,
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
    if (!req.user) {
      return res.unauthorized?.({
        message: "Unauthorized",
      });
    }

    const parsedBody = resendOTPBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.badRequest?.({ message: parsedBody.error.errors[0].message });
    }

    const { verificationType } = parsedBody.data;

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
    if (!req.user) {
      return res.unauthorized?.({
        message: "Unauthorized",
      });
    }

    const parsedBody = verifyOTPBodySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.badRequest?.({ message: parsedBody.error.errors[0].message });
    }

    const { otpCode, verificationType } = parsedBody.data;

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

    return res.success?.({
      data: {
        user: {
          id: user.id,
          email: user.email,
          deviceToken: device.token,
          deviceType: device.os,
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
