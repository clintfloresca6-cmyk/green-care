// src/routes/notification.routes.js
import { Router } from 'express'
import * as notificationController from '../controllers/notification.controller.js'
import { currentUser, requireUser } from '../middleware/currentUser.js'
import { validate } from '../middleware/validate.middleware.js'
import { notificationIdParamSchema } from '../validators/notification.validator.js'

const router = Router()
router.use(currentUser, requireUser)

router.get('/push/vapid-public-key', notificationController.getVapidPublicKey)
router.post('/push/subscribe',       notificationController.subscribePush)
router.delete('/push/subscribe',     notificationController.unsubscribePush)
router.patch('/read-all',  notificationController.markAllRead)
router.delete('/clear-all', notificationController.clearAll)
router.get('/', notificationController.list)
router.get('/:id', notificationController.get)
router.post('/', notificationController.create)
router.patch('/:id', notificationController.update)
router.delete('/:id', notificationController.archive)

export default router