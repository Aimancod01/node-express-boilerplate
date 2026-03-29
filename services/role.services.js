import HttpStatus from 'http-status-codes';

import { ROLE_NOT_FOUND } from '../constants';
import { AppError } from '../errors';
import { prisma } from '../utils';

export class RoleService {
	constructor(req) {
		this.req = req;
		this.body = req.body;
	}

	async getAllRoles() {
		const { query } = this.req;

		let { page, limit } = query;
		const { sort, ...search } = query;

		page = parseInt(page, 10) || 1;
		limit = parseInt(limit, 10) || 100;

		const where = { deleted: false };

		// Apply search filters
		if (search && Object.keys(search).length > 0) {
			Object.keys(search).forEach(key => {
				where[key] = {
					contains: search[key].toString(),
					mode: 'insensitive',
				};
			});
		}

		const orderBy = {};
		if (sort) {
			const [field, direction] = sort.split(':');
			orderBy[field] = direction === 'asc' ? 'asc' : 'desc';
		}

		const totalCount = await prisma.role.count({ where });
		const totalPages = Math.ceil(totalCount / limit);

		const start = (page - 1) * limit;
		const records = await prisma.role.findMany({
			where,
			orderBy,
			skip: start,
			take: limit,
		});

		return {
			records,
			totalRecords: totalCount,
			totalPages,
			query,
		};
	}

	async getRole() {
		const { id } = this.req.params;
		const role = await prisma.role.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!role) throw new AppError(ROLE_NOT_FOUND, HttpStatus.NOT_FOUND);

		return role;
	}

	async createRole() {
		const { body } = this.req;

		const role = await prisma.role.create({
			data: {
				name: body.name,
				description: body.description,
			},
		});

		return role;
	}

	async updateRole() {
		const { id } = this.req.params;
		const { body } = this.req;

		const existing = await prisma.role.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!existing) throw new AppError(ROLE_NOT_FOUND, HttpStatus.NOT_FOUND);

		const role = await prisma.role.update({
			where: { id: parseInt(id, 10) },
			data: body,
		});

		return role;
	}

	async deleteRole() {
		const { id } = this.req.params;

		const existing = await prisma.role.findFirst({
			where: { id: parseInt(id, 10), deleted: false },
		});

		if (!existing) throw new AppError(ROLE_NOT_FOUND, HttpStatus.NOT_FOUND);

		await prisma.role.update({
			where: { id: parseInt(id, 10) },
			data: { deleted: true },
		});

		return null;
	}
}
