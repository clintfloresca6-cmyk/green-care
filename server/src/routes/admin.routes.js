// src/routes/admin.routes.js
import { Router } from 'express'
import * as adminController from '../controllers/admin.controller.js'
import * as speciesController from '../controllers/species.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { updateReportSchema, listReportsQuerySchema } from '../validators/admin.validator.js'
import { updateSpeciesSchema } from '../validators/species.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.get('/', validate(listReportsQuerySchema, 'query'), adminController.list)
router.get('/reports', validate(listReportsQuerySchema, 'query'), adminController.list)
router.get('/stats', adminController.stats) // Add stats endpoint
router.get('/:id', adminController.get)
router.post('/', adminController.create) // TODO: Implement create function
router.patch('/:id', validate(updateReportSchema), adminController.updateReport)
router.delete('/:id', adminController.archive) // TODO: Implement archive function
router.patch('/species/:id', validate(updateSpeciesSchema), speciesController.updateSpecies)

export default router