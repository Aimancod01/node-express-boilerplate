import bcrypt from 'bcrypt';
import HttpStatus from 'http-status-codes';

import { USER_NOT_FOUND, ACCOUNT_STATUS } from '../constants';
import { AppError } from '../errors';
import { generateRandomString } from '../utils';

// In-memory user storage (replace with your database)
const users = [];

export class UserService {
	constructor(req) {
		this.req = req;
		this.body = req.body;
	}

	async getAllUsers() {
		const { query } = this.req;

		let { page, limit, sort, ...search } = query;

		page = parseInt(page, 10) || 1;
		limit = parseInt(limit, 10) || 100;

		let filteredUsers = users.filter(u => !u.deleted);

		// Apply search filters
		if (search && Object.keys(search).length > 0) {
			filteredUsers = filteredUsers.filter(user => {
				return Object.keys(search).every(key => {
					const searchValue = search[key];
					const userValue = user[key];

					if (
						!Number.isNaN(searchValue) &&
						!Number.isNaN(parseFloat(searchValue))
					) {
						return userValue === searchValue;
					}
					return userValue && userValue.toString().includes(searchValue);
				});
			});
		}

		// Apply sorting
		if (sort) {
			const [field, direction] = sort.split(':');
			filteredUsers.sort((a, b) => {
				if (direction === 'asc') {
					return a[field] > b[field] ? 1 : -1;
				}
				return a[field] < b[field] ? 1 : -1;
			});
		}

		const totalCount = filteredUsers.length;
		const totalPages = Math.ceil(totalCount / limit);

		// Pagination
		const start = (page - 1) * limit;
		const paginatedUsers = filteredUsers.slice(start, start + limit);

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
		const user = users.find(u => u.id === parseInt(id, 10) && !u.deleted);

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
		body.id = users.length + 1;
		body.created_by = user ? user.id : null;
		body.created_at = new Date();
		body.updated_at = new Date();
		body.deleted = false;

		users.push(body);

		return this.publicProfile(body);
	}

	async updateUser() {
		const { id } = this.req.params;
		const { body } = this.req;

		const userIndex = users.findIndex(
			u => u.id === parseInt(id, 10) && !u.deleted,
		);

		if (userIndex === -1)
			throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		users[userIndex] = {
			...users[userIndex],
			...body,
			updated_at: new Date(),
		};

		return this.publicProfile(users[userIndex]);
	}

	async updateManyUser() {
		const { ids, status } = this.req.body;

		let updateCount = 0;
		users.forEach((user, index) => {
			if (ids.includes(user.id) && !user.deleted) {
				users[index].status = status;
				users[index].updated_at = new Date();
				updateCount++;
			}
		});

		return { count: updateCount };
	}

	async deleteUser() {
		const { id } = this.req.params;

		const userIndex = users.findIndex(
			u => u.id === parseInt(id, 10) && !u.deleted,
		);

		if (userIndex === -1)
			throw new AppError(USER_NOT_FOUND, HttpStatus.NOT_FOUND);

		users[userIndex].deleted = true;
		users[userIndex].updated_at = new Date();

		return null;
	}

	async deleteManyUser() {
		const { ids } = this.req.body;

		users.forEach((user, index) => {
			if (ids.includes(user.id) && !user.deleted) {
				users[index].deleted = true;
				users[index].updated_at = new Date();
			}
		});

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
