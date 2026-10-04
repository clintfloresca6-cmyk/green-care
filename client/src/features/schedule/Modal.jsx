import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { todayISO } from '../../shared/utils/date.js'

export function Modal({ preselectPlantId, onClose }) {
    const { state, actions } = useGreenCare()

    function submit(event) {
        event.preventDefault()
        const formData = Object.fromEntries(new FormData(event.currentTarget))
        const payload = {
          plant_id: formData.plantId,
          type: formData.type,
          task_date: formData.date,
          task_time: formData.time || undefined,
          priority: formData.priority || undefined,
          status: formData.status || undefined
        }
        actions.createTask(payload)
        if (onClose) onClose()
    }

    return (
        <div className="modal-backdrop" onClick={(e) => {
            if (e.target === e.currentTarget) onClose && onClose()
        }}>
            <div className="modal">
                <div className="modal-head">
                    <h3>New Task</h3>
                    <button className="icon-btn" type="button" onClick={() => {
                        actions.closeModal()
                        if (onClose) onClose()
                    }}>×</button>
                </div>
                <form className="modal-body" onSubmit={submit}>
                    <div className="form-grid">
                        <div className="form-row">
                            <label>Plant *</label>
                            <select name="plantId" required defaultValue={preselectPlantId || state.plants[0]?.id}>
                                {state.plants.map((plant) => <option value={plant.id} key={plant.id}>{plant.name} - {plant.species}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <label>Task Type *</label>
                            <select name="type" required>
                                <option value="Water">Water</option>
                                <option value="Fertilize">Fertilize</option>
                                <option value="Prune">Prune</option>
                                <option value="Repot">Repot</option>
                                <option value="Clean">Clean</option>
                                <option value="Check">Check Health</option>
                                <option value="Rotate">Rotate</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <label>Date *</label>
                            <input type="date" name="date" required defaultValue={todayISO()} />
                        </div>
                        <div className="form-row">
                            <label>Time</label>
                            <input type="time" name="time" />
                        </div>
                        <div className="form-row">
                            <label>Priority</label>
                            <select name="priority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <label>Status</label>
                            <select name="status">
                                <option value="pending" selected>Pending</option>
                                <option value="completed">Completed</option>
                                <option value="skipped">Skipped</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <label>Notes</label>
                        <textarea name="notes" rows="3" placeholder="Any additional notes?"></textarea>
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-secondary" type="button" onClick={() => {
                            actions.closeModal()
                            if (onClose) onClose()
                        }}>Cancel</button>
                        <button className="btn btn-primary" type="submit">Save Task</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

