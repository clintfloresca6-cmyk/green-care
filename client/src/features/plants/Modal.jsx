import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { todayISO } from '../../shared/utils/date.js'

export function Modal({ preselectPlantId, onClose }) {
    const { state, actions } = useGreenCare()
    const [photo, setPhoto] = useState(null)

    function submit(event) {
        event.preventDefault()
        const formData = Object.fromEntries(new FormData(event.currentTarget))
        const payload = {
          plant_id: formData.plantId,
          activity: formData.activity,
          entry_date: formData.date,
          notes: formData.notes
        }
        actions.createJournalEntry(payload)
        if (onClose) onClose()
    }

    return (
        <div className="modal-backdrop" onClick={(e) => {
            if (e.target === e.currentTarget) onClose && onClose()
        }}>
            <div className="modal">
                <div className="modal-head">
                    <h3>New Journal Entry</h3>
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
                            <label>Activity *</label>
                            <select name="activity" required>
                                <option value="Watered">Watered</option>
                                <option value="Fertilized">Fertilized</option>
                                <option value="Pruned">Pruned</option>
                                <option value="Repotted">Repotted</option>
                                <option value="Cleaned">Cleaned</option>
                                <option value="Checked Health">Checked Health</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-row">
                            <label>Date</label>
                            <input type="date" name="date" defaultValue={todayISO()} />
                        </div>
                    </div>
                    <div className="form-row">
                        <label>Notes</label>
                        <textarea name="notes" rows="3" placeholder="What did you notice?"></textarea>
                    </div>
                    <div className="form-row">
                        <label>Photo</label>
                        <input type="file" accept="image/*" onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) {
                                const reader = new FileReader()
                                reader.onload = () => setPhoto(reader.result)
                                reader.readAsDataURL(file)
                            }
                        }} />
                        {photo && <div className="photo-preview"><img src={photo} alt="" /></div>}
                    </div>
                    <div className="modal-actions">
                        <button className="btn btn-secondary" type="button" onClick={() => {
                            actions.closeModal()
                            if (onClose) onClose()
                        }}>Cancel</button>
                        <button className="btn btn-primary" type="submit">Save Entry</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

