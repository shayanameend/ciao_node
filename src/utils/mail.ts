import nodemailer from "nodemailer";
import { env } from "../lib/env.js";

const transport = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	auth: {
		user: env.SMTP_USERNAME,
		pass: env.SMTP_PASSWORD,
	},
});

export interface Email {
	to: string;
	subject: string;
	body: string;
}

export const sendMail = async ({ to, subject, body }: Email) => {
	const msg = { from: env.ADMIN_EMAIL, to, subject, body };

	await transport.sendMail(msg);
};
