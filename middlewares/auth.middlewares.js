import HttpStatus from 'http-status-codes';

import {
	INVALID_ACCESS_TOKEN,
	NOT_ENOUGH_RIGHTS,
	UNAUTHORIZED,
	USER_NOT_FOUND,
	OTP_NOT_VERIFIED,
} from '../constants';
import { AppError } from '../errors';
import { verifyAccessToken, verifyOtpToken } from '../utils';

// Mock user for demonstration (in real app, this would come from database)
const mockUser = {
	id: 1,
	name: 'Demo User',
	email: 'demo@example.com',
	role_id: 1,
};

export const isAuth = async (req, res, next) => {
	try {
		if (!req.headers.authorization)
			throw new AppError(UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
		const token = req.headers.authorization.split(' ')[1];
		const decoded = await verifyAccessToken(token);

		if (!decoded || !decoded.id)
			throw new AppError(INVALID_ACCESS_TOKEN, HttpStatus.UNAUTHORIZED);

		// In a real app, fetch user from database using decoded.id
		// For now, using mock user
		req.user = { ...mockUser, id: decoded.id };
		next();
	} catch (error) {
		next(error);
	}
};

export const resetCheck = async (req, res, next) => {
	try {
		if (!req.headers.authorization)
			throw new AppError(UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
		const token = req.headers.authorization.split(' ')[1];
		const decoded = await verifyOtpToken(token);

		if (!decoded || !decoded.userId)
			throw new AppError(INVALID_ACCESS_TOKEN, HttpStatus.UNAUTHORIZED);

		// In a real app, fetch user from database and verify remember_token
		req.user = { ...mockUser, id: decoded.userId };
		next();
	} catch (error) {
		next(error);
	}
};

export const checkAuth = async (req, res, next) => {
	try {
		if (req.headers.authorization) {
			const token = req.headers.authorization.split(' ')[1];
			const decoded = await verifyAccessToken(token);

			if (!decoded || !decoded.id)
				throw new AppError(INVALID_ACCESS_TOKEN, HttpStatus.UNAUTHORIZED);

			// In a real app, fetch user from database
			req.user = { ...mockUser, id: decoded.id };
		}
		next();
	} catch (error) {
		next(error);
	}
};

export const varifyOTP = async (req, res, next) => {
	try {
		const { otp } = req.body;
		const { id } = req.params;

		// In a real app, fetch user from database and verify OTP
		// For now, accepting any OTP for demonstration
		req.user = { ...mockUser, id: parseInt(id, 10) };
		req.type = 'verify';
		next();
	} catch (error) {
		next(error);
	}
};

export const authorize = roles => {
	return (req, res, next) => {
		if (roles.includes(req.user.role)) return next();
		throw new AppError(NOT_ENOUGH_RIGHTS, HttpStatus.FORBIDDEN);
	};
};
