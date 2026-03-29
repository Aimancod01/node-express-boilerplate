import yup from 'yup';

import {
	INTEGER_ERROR,
	REQUIRED_FIELDS,
	GET_ROLE_QUERY_SCHEMA_CONFIG,
} from '../constants';
import { createQueryParamsSchema } from '../utils';

export const getRoleSchema = yup.object({
	query: createQueryParamsSchema(GET_ROLE_QUERY_SCHEMA_CONFIG),
});

export const addRoleSchema = yup.object({
	body: yup.object({
		name: yup.string().required(REQUIRED_FIELDS),
		description: yup.string().notRequired(),
	}),
});

export const updateRoleSchema = yup.object({
	body: yup.object({
		name: yup.string().notRequired(),
		description: yup.string().notRequired(),
	}),
	params: yup.object({
		id: yup
			.number()
			.integer(INTEGER_ERROR)
			.max(99999999999)
			.required(REQUIRED_FIELDS),
	}),
});

export const roleIdSchema = yup.object({
	params: yup.object({
		id: yup
			.number()
			.integer(INTEGER_ERROR)
			.max(99999999999)
			.required(REQUIRED_FIELDS),
	}),
});

export const deleteManyRoleSchema = yup.object({
	body: yup.object({
		ids: yup.array().required(REQUIRED_FIELDS),
	}),
});
