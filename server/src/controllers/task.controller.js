import { asyncHandler } from '../utils/asyncHandler.js'
import * as tasksService from '../services/tasks.service.js'
import { pool } from '../config/db.js'

export const list = asyncHandler(async (req, res) => {
  const tasks = await tasksService.listForUser(req.user.id, req.query)
  res.json({ data: tasks })
})

export const create = asyncHandler(async (req, res) => {
  const task = await tasksService.createForUser(req.user.id, req.body)
  res.status(201).json({ data: task })
})

export const get = asyncHandler(async (req, res) => {
  const tasks = await tasksService.listForUser(req.user.id, {})
  const task = tasks.find(t => t.id === req.params.id)
  if (!task) {
    res.status(404).json({ error: 'Task not found' })
    return
  }
  res.json({ data: task })
})

export const update = asyncHandler(async (req, res) => {
  const task = await tasksService.updateForUser(req.user.id, req.params.id, req.body)
  res.json({ data: task })
})

export const archive = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )

  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Task not found' })
    return
  }

  res.status(204).end()
})

export const complete = asyncHandler(async (req, res) => {
  const task = await tasksService.completeForUser(req.user.id, req.params.id)
  res.json({ data: task })
})