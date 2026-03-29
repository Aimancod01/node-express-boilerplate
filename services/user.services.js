import bcrypt from 'bcryptjs';
import HttpStatus from 'http-status-codes';

import { USER_NOT_FOUND, ACCOUNT_STATUS } from '../constants';
import { AppError } from '../errors';
import { generateRandomString, prisma } from '../utils';

export class UserService {
	constructor(req) {
		this.req = req;
		this.body = req.body;
	}

	async getAllUsers(roleName) {
		const { query } = this.req;

		let { page, limit } = query;
		const { sort, ...search } = query;

		page = parseInt(page, 10) || 1;
		limit = parseInt(limit, 10) || 100;

		const where = { deleted: false };
		if (roleName) {
			where.role = { name: roleName };
		}

		// Apply search filters
		if (search && Object.keys(search).length > 0) {
			Object.keys(search).forEach(key => {
				where[key] = {
					contains: search[key].toString(),
					mode: 'insensitive',
				};
			});
		}

		// Apply sorting
		const orderBy = {};
		if (sort) {
			const [field, direction] = sort.split(':');
			orderBy[field] = direction === 'asc' ? 'asc' : 'desc';
		}

		const totalCount = await prisma.user.count({ where });
		const totalPages = Math.ceil(totalCount / limit);

		// Pagination
		const start = (page - 1) * limit;
		const paginatedUsers = await prisma.user.findMany({
			where,
			orderBy,
			skip: start,
			take: limit,
		});

		// Remove sensitive fields
		const allRecords = paginatedUsers.map(user => this.publicProfile(user));

		return {
			records: allRecords,
			totalRecords: totalCount,
			totalPages,
			query,
		};
	}

	async getUser() {
		const { id } = this.req.params;
		const user = await prisma.user.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!user) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		return this.publicProfile(user);
	}

	async createUser() {
		const { body, user } = this.req;
		let { password } = body;

		if (!password) {
			password = generateRandomString(6, 20);
		}

		body.password = await bcrypt.hash(password, 12);
		body.status = ACCOUNT_STATUS.ACTIVE;
		body.created_by = user ? user.id : null;

		const newUser = await prisma.user.create({
			data: body,
		});

		return this.publicProfile(newUser);
	}

	async updateUser() {
		const { id } = this.req.params;
		const { body } = this.req;

		const existing = await prisma.user.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!existing) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		const updatedUser = await prisma.user.update({
			where: { id: parseInt(id, 10) },
			data: body,
		});

		return this.publicProfile(updatedUser);
	}

	async updateManyUser() {
		const { ids, status } = this.req.body;

		const result = await prisma.user.updateMany({
			where: {
				id: { in: ids },
				deleted: false,
			},
			data: { status },
		});

		return { count: result.count };
	}

	async deleteUser() {
		const { id } = this.req.params;

		const existing = await prisma.user.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!existing) throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		await prisma.user.update({
			where: { id: parseInt(id, 10) },
			data: { deleted: true },
		});

		return null;
	}

	async deleteManyUser() {
		const { ids } = this.req.body;

		await prisma.user.updateMany({
			where: {
				id: { in: ids },
				deleted: false,
			},
			data: { deleted: true },
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
