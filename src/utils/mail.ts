import { CourierClient } from "@trycourier/courier";
import { env } from "../env.js";

const courier = new CourierClient({
	authorizationToken: env.COURIER_AUTH_TOKEN,
});

export async function sendEmail({
	name,
	email,
	body,
}: {
	name: string;
	email: string;
	body: string;
}) {
	const { requestId } = await courier.send({
		message: {
			to: {
				data: {
					name,
				},
				email,
			},
			content: {
				title: "Hey {{name}} 👋",
				body,
			},
			routing: {
				method: "single",
				channels: ["email"],
			},
		},
	});
}
