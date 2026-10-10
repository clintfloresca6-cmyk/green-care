import { Router } from 'express'
import * as reportController from '../controllers/report.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { createReportSchema, updateReportSchema } from '../validators/report.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.post('/', validate(createReportSchema), reportController.create)
router.get('/', reportController.list)
router.get('/:id', reportController.get)
router.patch('/:id', validate(updateReportSchema), reportController.updateStatus)

export default router