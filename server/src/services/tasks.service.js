import { pool } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'

export async function listForUser(userId, { status } = {}) {
  const where = ['user_id = ?']
  const values = [userId]

  if (status) {
    where.push('status = ?')
    values.push(status)
  }

  const [rows] = await pool.query(
    `SELECT * FROM tasks
      WHERE ${where.join(' AND ')}
      ORDER BY task_date, task_time`,
    values,
  )
  return rows
}

export async function createForUser(userId, payload) {
  const id = randomUUID().replace(/-/g, '').slice(0, 26)

  // Verify the plant belongs to the user before creating a task for it.
  const [owned] = await pool.query(
    'SELECT id FROM plants WHERE id = ? AND user_id = ? AND archived_at IS NULL',
    [payload.plant_id, userId],
  )
  if (!owned.length) throw new ApiError(404, 'Plant not found')

  // Convert 0 to null for storage (0 means no repeat)
  const isRepeating = payload.is_repeating > 0 ? payload.is_repeating : null

  await pool.query(
    `INSERT INTO tasks
       (id, user_id, plant_id, type, task_date, task_time, status, priority, is_repeating)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id,
      userId,
      payload.plant_id,
      payload.type,
      payload.task_date,
      payload.task_time ?? 'Anytime',
      payload.status ?? 'pending',
      payload.priority ?? 'medium',
      isRepeating,
    ],
  )

  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id])
  return rows[0]
}

export async function completeForUser(userId, taskId) {
  // First, get the current task to check if it's repeating
  const [currentTask] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId]
  );
  if (!currentTask.length) throw new ApiError(404, 'Task not found');

  // Mark the current task as completed
  const [result] = await pool.query(
    `UPDATE tasks
        SET status = 'completed', completed_at = NOW()
      WHERE id = ? AND user_id = ?`,
    [taskId, userId]
  );
  if (!result.affectedRows) throw new ApiError(404, 'Task not found');

  // If the task is repeating, create a new task
  if (currentTask[0].is_repeating && currentTask[0].is_repeating > 0) {
    // Calculate the next task date
    const taskDate = new Date(currentTask[0].task_date); // task_date is a string in YYYY-MM-DD
    taskDate.setDate(taskDate.getDate() + currentTask[0].is_repeating);
    const nextTaskDate = taskDate.toISOString().split('T')[0];

    // Create a new task with the same properties, but new date and pending status
    const newTaskId = randomUUID().replace(/-/g, '').slice(0, 26);
    await pool.query(
      `INSERT INTO tasks
         (id, user_id, plant_id, type, task_date, task_time, status, priority, is_repeating)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        newTaskId,
        userId,
        currentTask[0].plant_id,
        currentTask[0].type,
        nextTaskDate,
        currentTask[0].task_time,
        'pending', // status
        currentTask[0].priority,
        currentTask[0].is_repeating // same repeat interval
      ]
    );
  }

  // Return the updated current task
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
  return rows[0];
}

export async function updateForUser(userId, taskId, payload) {
  // Verify the task belongs to the user and get the current task
  const [currentTask] = await pool.query(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [taskId, userId]
  )
  if (!currentTask.length) throw new ApiError(404, 'Task not found')

  // Verify the plant belongs to the user if plant_id is being updated
  if (payload.plant_id !== undefined) {
    const [owned] = await pool.query(
      'SELECT id FROM plants WHERE id = ? AND user_id = ? AND archived_at IS NULL',
      [payload.plant_id, userId]
    )
    if (!owned.length) throw new ApiError(404, 'Plant not found')
  }

  // Build update query dynamically based on provided fields
  const fields = []
  const values = []

  if (payload.plant_id !== undefined) {
    fields.push('plant_id = ?')
    values.push(payload.plant_id)
  }
  if (payload.type !== undefined) {
    fields.push('type = ?')
    values.push(payload.type)
  }
  if (payload.task_date !== undefined) {
    fields.push('task_date = ?')
    values.push(payload.task_date)
  }
  if (payload.task_time !== undefined) {
    fields.push('task_time = ?')
    values.push(payload.task_time)
  }
  if (payload.status !== undefined) {
    fields.push('status = ?')
    values.push(payload.status)
  }
  if (payload.priority !== undefined) {
    fields.push('priority = ?')
    values.push(payload.priority)
  }
  if (payload.is_repeating !== undefined) {
    fields.push('is_repeating = ?')
    // Convert 0 to null for storage (0 means no repeat)
    const isRepeating = payload.is_repeating > 0 ? payload.is_repeating : null
    values.push(isRepeating)
  }

  if (fields.length === 0) {
    // No fields to update, return current task
    return currentTask[0]
  }

  values.push(taskId, userId)

  await pool.query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  )

  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId])
  return rows[0]
}

