import nodemailer from 'nodemailer';

import {
	SMTP_USER,
	SMTP_PASS,
	SMTP_HOST,
	SMTP_PORT,
	FROM_NAME,
	FROM_EMAIL,
} from '../config';

const transporter = nodemailer.createTransport({
	host: SMTP_HOST,
	port: SMTP_PORT || 587,
	secure: false,
	auth: {
		user: SMTP_USER,
		pass: SMTP_PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

export const sendEmail = async mailOptions => {
	try {
		await transporter.sendMail({
			from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
			to: mailOptions.to,
			subject: mailOptions.subject,
			text: mailOptions.text,
			html: mailOptions.html,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error sending email:', error);
		throw error;
	}
};
