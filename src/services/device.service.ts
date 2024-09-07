import { db } from "../lib/db.js";
import type { Device, User } from "../types/db.js";
import type { Platform } from "../types/misc.js";

interface UpsertDeviceProps {
	user: User;
	devicePlatform: Platform;
	deviceToken: string;
}

interface UpsertDeviceReturns {
	device: Device;
}

export async function upsertDevice({
	user,
	devicePlatform,
	deviceToken,
}: UpsertDeviceProps): Promise<UpsertDeviceReturns> {
	const device = await db.device.upsert({
		where: {
			token: deviceToken,
		},
		create: {
			token: deviceToken,
			os: devicePlatform,
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

	return { device };
}
