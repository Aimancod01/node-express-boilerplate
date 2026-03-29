import { Router } from 'express';

import {
	getAllUsers,
	getUser,
	createUser,
	updateUser,
	updateManyUser,
	deleteUser,
	deleteManyUser,
} from '../controllers';
import { validate, isAuth } from '../middlewares';
import {
	getUsersSchema,
	registerSchema,
	userIdSchema,
	updateUserSchema,
	deleteUsersSchema,
	updateManyUserSchema,
} from '../validations';

const router = Router();

router.get('/', isAuth, validate(getUsersSchema), getAllUsers);
router.get('/:id', isAuth, validate(userIdSchema), getUser);
router.post('/', isAuth, validate(registerSchema), createUser);
router.put('/:id', isAuth, validate(updateUserSchema), updateUser);
router.put('/', isAuth, validate(updateManyUserSchema), updateManyUser);
router.delete('/:id', isAuth, validate(userIdSchema), deleteUser);
router.delete('/', isAuth, validate(deleteUsersSchema), deleteManyUser);

export const UserRoutes = router;
