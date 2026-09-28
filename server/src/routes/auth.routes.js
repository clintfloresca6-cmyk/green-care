// src/routes/auth.routes.js
import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { loginSchema, signupSchema } from '../validators/auth.validator.js'

const router = Router()

// Public routes (no authentication required)
router.post('/login', validate(loginSchema), authController.login)
router.post('/signup', validate(signupSchema), authController.signup)

// Protected routes (authentication required)
router.use(currentUser, requireUser)
router.get('/', authController.list)
router.get('/:id', authController.get)
router.patch('/:id', validate(signupSchema), authController.update)
router.delete('/:id', authController.archive)

export default router