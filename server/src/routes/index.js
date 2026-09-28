import { Router } from 'express'
import authRoutes from './auth.routes.js'
import plantsRoutes from './plants.routes.js'
import tasksRoutes from './tasks.routes.js'
import journalRoutes from './journal.routes.js'
import notificationsRoutes from './notifications.routes.js'
import libraryRoutes from './library.routes.js'
import adminRoutes from './admin.routes.js'
import trefleRoutes from './trefle.routes.js'

export const routes = Router()

routes.use('/auth', authRoutes)
routes.use('/plants', plantsRoutes)
routes.use('/tasks', tasksRoutes)
routes.use('/journal', journalRoutes)
routes.use('/notifications', notificationsRoutes)
routes.use('/library', libraryRoutes)
routes.use('/admin', adminRoutes)
routes.use('/trefle', trefleRoutes)