import bcrypt from 'bcrypt';
import HttpStatus from 'http-status-codes';

import {
	INVALID_CREDENTIALS,
	USER_NOT_FOUND,
	ACCOUNT_STATUS,
} from '../constants';
import { AppError } from '../errors';
import { createAccessToken, createOtpToken, sendEmail } from '../utils';

// In-memory user storage (replace with your database)
const users = [];

export class AuthService {
	constructor(req) {
		this.req = req;
	}

	async login() {
		const { email, password } = this.req.body;

		const user = users.find(
			u => u.email === email && u.status === ACCOUNT_STATUS.ACTIVE,
		);

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid)
			throw new AppError(INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST);

		const updateRecord = this.publicProfile(user);

		return {
			accessToken: createAccessToken({ id: user.id }),
			user: updateRecord,
		};
	}

	async register() {
		const { body } = this.req;
		const { password } = body;

		body.password = await bcrypt.hash(password, 12);
		body.status = ACCOUNT_STATUS.ACTIVE;
		body.id = users.length + 1;
		body.created_at = new Date();
		body.updated_at = new Date();

		if (this.req.user && this.req.user.id) body.created_by = this.req.user.id;

		users.push(body);

		return this.publicProfile(body);
	}

	async getLoggedInUser() {
		const { user } = this.req;
		return this.publicProfile(user);
	}

	async OtpVerify() {
		const { id } = this.req.params;
		const user = users.find(u => u.id === parseInt(id, 10));

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		user.status = ACCOUNT_STATUS.ACTIVE;
		user.remember_token = null;

		return {
			accessToken: createAccessToken({ id: user.id }),
			user: this.publicProfile(user),
		};
	}

	async ResendOTP() {
		const { id } = this.req.params;
		const user = users.find(u => u.id === parseInt(id, 10));

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		// Generate and send OTP (implement your logic)
		return null;
	}

	async ForgotPassword() {
		const { email } = this.req.body;
		const user = users.find(u => u.email === email);

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		// Generate and send OTP (implement your logic)
		return null;
	}

	async ResetPassword() {
		const { id } = this.req.params;
		const { password } = this.req.body;
		const user = users.find(u => u.id === parseInt(id, 10));

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		user.password = await bcrypt.hash(password, 12);
		user.remember_token = null;

		return null;
	}

	publicProfile(user) {
		const record = { ...user };
		if (!record || !record.id)
			throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		if (record.password) delete record.password;
		if (record.remember_token) delete record.remember_token;

		return record;
	}
}
