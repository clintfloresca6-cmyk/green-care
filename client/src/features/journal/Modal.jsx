import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { todayISO } from '../../shared/utils/date.js'

export function Modal({ preselectPlantId, onClose }) {
    const { state, actions } = useGreenCare()
    const [photo, setPhoto] = useState(null)
    const [photoFile, setPhotoFile] = useState(null)
    const [isSaving, setIsSaving] = useState(false)

    // Convert File to base64 string
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                // Remove the data URL prefix (e.g., 'data:image/jpeg;base64,')
                const base64 = reader.result.split(',')[1]
                resolve(base64)
            }
            reader.onerror = (error) => reject(error)
        })
    }

    async function submit(event) {
        event.preventDefault()
        const formData = Object.fromEntries(new FormData(event.currentTarget))

        // Prepare data for submission
        let photoUrl = null

        // If we have a selected file, convert it to base64 for upload
        if (photoFile) {
            try {
                const base64Image = await fileToBase64(photoFile)
                photoUrl = base64Image // Send base64 to backend for ImgBB upload
            } catch (error) {
                console.error('Error converting image to base64:', error)
                // If conversion fails, we won't include a photo
                photoUrl = null
            }
        }

        const payload = {
          plant_id: formData.plantId,
          activity: formData.activity,
          entry_date: formData.date,
          notes: formData.notes,
          photo: photoUrl // Include photo (either base64 for upload or null)
        }

        setIsSaving(true)
        try {
          await actions.createJournalEntry(payload)
          // Reset photoFile state on success
          setPhotoFile(null)
          // Show success toast
          const selectedPlant = state.plants.find(p => p.id === formData.plantId)
          const plantName = selectedPlant ? selectedPlant.name : 'a plant'
          actions.toast(`Successfully Added ${formData.activity} for ${plantName}`)
        } catch (error) {
          console.error('Failed to create journal entry:', error)
          // Optionally show error toast
          actions.toast('Failed to add journal entry. Please try again.')
        } finally {
          setIsSaving(false)
          if (onClose) onClose()
        }
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
                                setPhotoFile(file)
                                const reader = new FileReader()
                                reader.onload = () => setPhoto(URL.createObjectURL(file))
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
                        <button className="btn btn-primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

