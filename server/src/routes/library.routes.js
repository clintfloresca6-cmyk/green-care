// src/routes/library.routes.js
import { Router } from 'express'
import * as libraryController from '../controllers/library.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { searchLibrarySchema, speciesIdParamSchema } from '../validators/library.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.get('/', validate(searchLibrarySchema, 'query'), libraryController.search)
router.get('/:id', validate(speciesIdParamSchema, 'params'), libraryController.getSpecies)
router.post('/', libraryController.create) 
router.patch('/:id', libraryController.update)
router.delete('/:id', libraryController.archive)

export default router