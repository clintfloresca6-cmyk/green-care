// src/routes/library.routes.js
import { Router } from 'express'
import * as libraryController from '../controllers/library.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { searchLibrarySchema, speciesIdParamSchema } from '../validators/library.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.get('/', libraryController.search)
router.get('/:id', libraryController.getSpecies)
router.post('/', libraryController.create) // TODO: Implement create function
router.patch('/:id', libraryController.update) // TODO: Implement update function
router.delete('/:id', libraryController.archive) // TODO: Implement archive function

export default router