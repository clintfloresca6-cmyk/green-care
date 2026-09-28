// src/routes/task.routes.js
import { Router } from 'express'
import * as taskController from '../controllers/task.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { createTaskSchema, listTasksQuerySchema } from '../validators/task.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.get('/', taskController.list)
router.get('/:id', taskController.get)
router.post('/', validate(createTaskSchema), taskController.create)
router.patch('/:id', validate(createTaskSchema), taskController.update)
router.delete('/:id', taskController.archive)

export default router