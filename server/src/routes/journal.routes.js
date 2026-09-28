// src/routes/journal.routes.js
import { Router } from 'express'
import * as journalController from '../controllers/journal.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { createJournalSchema, listJournalQuerySchema } from '../validators/journal.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.get('/', journalController.list)
router.get('/:id', journalController.get)
router.post('/', validate(createJournalSchema), journalController.create)
router.patch('/:id', validate(createJournalSchema), journalController.update)
router.delete('/:id', journalController.archive)

export default router