import { Router } from 'express'
import * as trefleController from '../controllers/trefle.controller.js'

const router = Router()

// No authentication required for Trefle API integration as per requirement
router.get('/plants', trefleController.listTreflePlants)
router.get('/species/:id', trefleController.getTrefleSpeciesById)
router.get('/search', trefleController.searchTreflePlants)

export default router