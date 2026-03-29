import HttpStatus from 'http-status-codes';

import { ROLE_NOT_FOUND } from '../constants';
import { AppError } from '../errors';

// In-memory role storage (replace with your database)
const roles = [
	{ id: 1, name: 'Admin', description: 'Administrator', deleted: false },
	{ id: 2, name: 'User', description: 'Regular User', deleted: false },
];

export class RoleService {
	constructor(req) {
		this.req = req;
		this.body = req.body;
	}

	async getAllRoles() {
		const { query } = this.req;

		let { page, limit, sort, ...search } = query;

		page = parseInt(page, 10) || 1;
		limit = parseInt(limit, 10) || 100;

		let filteredRoles = roles.filter(r => !r.deleted);

		// Apply search filters
		if (search && Object.keys(search).length > 0) {
			filteredRoles = filteredRoles.filter(role => {
				return Object.keys(search).every(key => {
					const searchValue = search[key];
					const roleValue = role[key];

					if (
						!Number.isNaN(searchValue) &&
						!Number.isNaN(parseFloat(searchValue))
					) {
						return roleValue === searchValue;
					}
					return roleValue && roleValue.toString().includes(searchValue);
				});
			});
		}

		// Apply sorting
		if (sort) {
			const [field, direction] = sort.split(':');
			filteredRoles.sort((a, b) => {
				if (direction === 'asc') {
					return a[field] > b[field] ? 1 : -1;
				}
				return a[field] < b[field] ? 1 : -1;
			});
		}

		const totalCount = filteredRoles.length;
		const totalPages = Math.ceil(totalCount / limit);

		// Pagination
		const start = (page - 1) * limit;
		const paginatedRoles = filteredRoles.slice(start, start + limit);

		return {
			records: paginatedRoles,
			totalRecords: totalCount,
			totalPages,
			query,
		};
	}

	async getRole() {
		const { id } = this.req.params;
		const role = roles.find(r => r.id === parseInt(id, 10) && !r.deleted);

		if (!role) throw new AppError(ROLE_NOT_FOUND, HttpStatus.NOT_FOUND);

		return role;
	}

	async createRole() {
		const { body } = this.req;

		body.id = roles.length + 1;
		body.created_at = new Date();
		body.updated_at = new Date();
		body.deleted = false;

		roles.push(body);

		return body;
	}

	async updateRole() {
		const { id } = this.req.params;
		const { body } = this.req;

		const roleIndex = roles.findIndex(
			r => r.id === parseInt(id, 10) && !r.deleted,
		);

		if (roleIndex === -1)
			throw new AppError(ROLE_NOT_FOUND, HttpStatus.NOT_FOUND);

		roles[roleIndex] = { ...roles[roleIndex], ...body, updated_at: new Date() };

		return roles[roleIndex];
	}

	async deleteRole() {
		const { id } = this.req.params;

		const roleIndex = roles.findIndex(
			r => r.id === parseInt(id, 10) && !r.deleted,
		);

		if (roleIndex === -1)
			throw new AppError(ROLE_NOT_FOUND, HttpStatus.NOT_FOUND);

		roles[roleIndex].deleted = true;
		roles[roleIndex].updated_at = new Date();

		return null;
	}
}
