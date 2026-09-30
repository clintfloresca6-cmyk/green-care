// src/routes/plants.routes.js
import { Router } from 'express'
import * as plantsController from '../controllers/plants.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { createPlantSchema, updatePlantSchema } from '../validators/plants.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.get('/', plantsController.list)
router.get('/:id', plantsController.get)
router.post('/', validate(createPlantSchema), plantsController.create)
router.patch('/:id', validate(updatePlantSchema), plantsController.update)
router.delete('/:id', plantsController.archive)
router.post('/analyze-image', plantsController.analyzeImage)

export default router
