import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'

export function Modal({ preselectPlantId, onClose }) {
    const { state, actions } = useGreenCare()
    const [observationNote, setObservationNote] = useState('')

    // Find the plant to get its current health for default value
    const plant = state.plants.find(p => p.id === preselectPlantId)
    const initialHealth = plant ? plant.health : 'Good'
    const [healthStatus, setHealthStatus] = useState(initialHealth)

    function submit(event) {
        event.preventDefault()
        // Update plant health via the updatePlant action
        actions.updatePlant(preselectPlantId, {
          health: healthStatus,
          notes: observationNote // Assuming we want to save observation note to plant's notes field
        })
        // Optionally show a toast
        actions.toast(`Health updated to ${healthStatus}`)
        if (onClose) onClose()
    }

    return (
        <div className="modal-backdrop" onClick={(e) => {
            if (e.target === e.currentTarget) onClose && onClose()
        }}>
            <div className="modal">
                <div className="modal-head">
                    <h3>Update Plant Health</h3>
                    <button className="icon-btn" type="button" onClick={() => {
                        actions.closeModal()
                        if (onClose) onClose()
                    }}>×</button>
                </div>
                <form className="modal-body" onSubmit={submit}>
                    <div className="form-row">
                        <label>Health Status *</label>
                        <select
                          value={healthStatus}
                          onChange={(e) => setHealthStatus(e.target.value)}
                          required
                        >
                          <option value="Healthy">Healthy</option>
                          <option value="Good">Good</option>
                          <option value="Needs Attention">Needs Attention</option>
                          <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <label>Observation Note</label>
                        <textarea
                          value={observationNote}
              onChange={(e) => setObservationNote(e.target.value)}
              rows="4"
              placeholder="Note any observations about the plant's health..."
            />
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-secondary" type="button" onClick={() => {
                            actions.closeModal()
                            if (onClose) onClose()
                        }}>Cancel</button>
                        <button className="btn btn-primary" type="submit">Update Health</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

