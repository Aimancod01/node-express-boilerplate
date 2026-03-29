import fs from 'fs';
import path from 'path';

import HttpStatus from 'http-status-codes';
import multer from 'multer';

import {
	ERROR_DURING_PICTURE_UPLOAD,
	ERROR_DURING_FILE_UPLOAD,
} from '../constants';
import { AppError } from '../errors';

export const createMulterUpload = userId => {
	const storage = multer.diskStorage({
		destination(req, file, cb) {
			const uploadDir = path.join(process.cwd(), 'uploads', String(userId));
			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir, { recursive: true });
			}
			cb(null, uploadDir);
		},
		filename(req, file, cb) {
			const timestamp = Date.now();
			const ext = path.extname(file.originalname);
			const base =
				file.fieldname === 'profile_picture' ? 'profile_picture' : 'lab_file';

			cb(null, `${base}-${timestamp}${ext}`);
		},
	});

	const fileFilter = (req, file, cb) => {
		if (file.fieldname === 'profile_picture') {
			// allow only images
			const allowedImageTypes = [
				'image/jpeg',
				'image/jpg',
				'image/png',
				'image/gif',
				'image/webp',
			];
			if (!allowedImageTypes.includes(file.mimetype)) {
				return cb(
					new AppError(ERROR_DURING_PICTURE_UPLOAD, HttpStatus.BAD_REQUEST),
					false,
				);
			}
			return cb(null, true);
		}

		if (file.fieldname === 'lab_files') {
			// allow only PDFs and images
			const allowedDocTypes = [
				'application/pdf',
				'image/jpeg',
				'image/jpg',
				'image/png',
				'image/webp',
			];
			if (!allowedDocTypes.includes(file.mimetype)) {
				return cb(
					new AppError(ERROR_DURING_FILE_UPLOAD, HttpStatus.BAD_REQUEST),
					false,
				);
			}
			return cb(null, true);
		}

		return cb(null, true);
	};

	return multer({
		storage,
		fileFilter,
	});
};
