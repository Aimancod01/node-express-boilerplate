import bcrypt from 'bcryptjs';
import HttpStatus from 'http-status-codes';

import {
	INVALID_CREDENTIALS,
	USER_NOT_FOUND,
	ACCOUNT_STATUS,
} from '../constants';
import { AppError } from '../errors';
import { createAccessToken, prisma } from '../utils';

export class AuthService {
	constructor(req) {
		this.req = req;
	}

	async login() {
		const { email, password } = this.req.body;

		const user = await prisma.user.findFirst({
			where: { email, status: ACCOUNT_STATUS.ACTIVE, deleted: false },
		});

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

		if (this.req.user && this.req.user.id) body.created_by = this.req.user.id;

		const newUser = await prisma.user.create({
			data: body,
		});

		return this.publicProfile(newUser);
	}

	async getLoggedInUser() {
		const { user } = this.req;
		return this.publicProfile(user);
	}

	async OtpVerify() {
		const { id } = this.req.params;
		const user = await prisma.user.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		const updatedUser = await prisma.user.update({
			where: { id: parseInt(id, 10) },
			data: { status: ACCOUNT_STATUS.ACTIVE, remember_token: null },
		});

		return {
			accessToken: createAccessToken({ id: updatedUser.id }),
			user: this.publicProfile(updatedUser),
		};
	}

	async ResendOTP() {
		const { id } = this.req.params;
		const user = await prisma.user.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		// Generate and send OTP (implement your logic)
		return null;
	}

	async ForgotPassword() {
		const { email } = this.req.body;
		const user = await prisma.user.findFirst({
			where: { email, deleted: false },
		});

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		// Generate and send OTP (implement your logic)
		return null;
	}

	async ResetPassword() {
		const { id } = this.req.params;
		const { password } = this.req.body;
		const user = await prisma.user.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		const hashedPassword = await bcrypt.hash(password, 12);
		await prisma.user.update({
			where: { id: parseInt(id, 10) },
			data: { password: hashedPassword, remember_token: null },
		});

		return null;
	}

	// eslint-disable-next-line class-methods-use-this
	publicProfile(user) {
		const record = { ...user };
		if (!record || !record.id)
			throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		if (record.password) delete record.password;
		if (record.remember_token) delete record.remember_token;

		return record;
	}
}
