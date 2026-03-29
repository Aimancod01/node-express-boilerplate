import { Router } from 'express';

import {
	getAllRoles,
	getRole,
	createRole,
	updateRole,
	deleteRole,
	deleteManyRole,
} from '../controllers';
import { validate, isAuth } from '../middlewares';
import {
	getRoleSchema,
	addRoleSchema,
	roleIdSchema,
	updateRoleSchema,
	deleteManyRoleSchema,
} from '../validations';

const router = Router();

router.get('/', isAuth, validate(getRoleSchema), getAllRoles);
router.get('/:id', isAuth, validate(roleIdSchema), getRole);
router.post('/', isAuth, validate(addRoleSchema), createRole);
router.put('/:id', isAuth, validate(updateRoleSchema), updateRole);
router.delete('/:id', isAuth, validate(roleIdSchema), deleteRole);
router.delete('/', isAuth, validate(deleteManyRoleSchema), deleteManyRole);

export const RoleRoutes = router;
