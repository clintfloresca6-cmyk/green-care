import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { todayISO } from '../../shared/utils/date.js'
import warningIcon from '../../assets/warning.svg'

export function DiagnosisModal({ preselectPlantId, onClose }) {
    const { state, actions } = useGreenCare()
    const [photo, setPhoto] = useState(null)
    const [phase, setPhase] = useState('idle')
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [barWidth, setBarWidth] = useState(0)
    const [selectedPlantId, setSelectedPlantId] = useState(preselectPlantId || (state.plants[0]?.id ?? null))

    // Mock function to convert file to data URL
    const readFile = (file) => {
        if (!file) return Promise.resolve(null)
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(file)
        })
    }

    // Analyze image using the backend endpoint
    const analyzeImageWithBackend = async (dataUrl) => {
        // Send the data URL as the image field (backend will strip the data URL prefix if present)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/plants/analyze-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ image: dataUrl })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Failed to analyze image: ${response.status}`)
        }

        const data = await response.json()
        return data.result
    }

    function analyze() {
        if (!photo) return

        setPhase('loading')
        setBarWidth(0)
        setError(null)

        // Simulate progress
        window.setTimeout(() => setBarWidth(100), 50)

        // Actually analyze the image via backend
        analyzeImageWithBackend(photo)
            .then((analysisResult) => {
                setResult(analysisResult)
                setPhase('done')
            })
            .catch((err) => {
                setError(err.message || 'Failed to analyze image')
                setPhase('error')
            })
            .finally(() => {
                window.setTimeout(() => setBarWidth(0), 100)
            })
    }

    function retry() {
        setPhase('idle')
        setResult(null)
        setError(null)
        setPhoto(null)
    }

    function updateHealth() {
        if (!result || result === "The image must be plant") return
        // Update the plant's health and photo (the uploaded image)
        actions.updatePlant(selectedPlantId, {
            health: result,
            photo: photo // photo is the data URL from the upload
        })
        // Create journal entry for health check
        try {
            const journalPayload = {
                plant_id: selectedPlantId,
                entry_date: todayISO(),
                activity: "Checked Health",
                notes: `Health updated to ${result} via AI diagnosis`
            }
            actions.createJournalEntry(journalPayload)
        } catch (journalError) {
            console.error('Failed to create journal entry:', journalError)
            // Don't throw - we still want the health update to succeed even if journal fails
        }

        // Create event notification for health update
        try {
            const notificationPayload = {
                id: `event-health-updated-${Date.now()}`,
                text: `Health updated to ${result} for ${state.plants.find(p => p.id === selectedPlantId)?.name || 'a plant'}`,
                icon: warningIcon,
                notice_date: todayISO(),
                is_read: false,
                page: 'plants',
                plantId: selectedPlantId
            }
            actions.addNotification(notificationPayload)
        } catch (notificationError) {
            console.error('Failed to create event notification:', notificationError)
        }

        // Show a toast
        actions.toast(`Health updated to ${result}`)
        // Close the modal
        if (onClose) onClose()
        setPhase('idle')
        setResult(null)
        setPhoto(null)
    }

    return (
        <div className="modal-backdrop" onClick={(e) => {
            if (e.target === e.currentTarget) onClose && onClose()
        }}>
            <div className="modal">
                <div className="modal-head">
                    <h3>Plant Diagnosis</h3>
                    <button className="icon-btn" type="button" onClick={() => {
                        actions.closeModal()
                        if (onClose) onClose()
                    }}>×</button>
                </div>
                <form className="modal-body">
                    {/* Plant Selection Dropdown */}
                    <div className="form-row">
                        <label>Select Plant to Diagnose</label>
                        <select
                            value={selectedPlantId}
                            onChange={(e) => setSelectedPlantId(e.target.value)}
                            required
                        >
                            {state.plants.map((plant) => (
                                <option key={plant.id} value={plant.id}>
                                    {plant.name} - {plant.species}
                                </option>
                            ))}
                        </select>
                    </div>

                    {phase === 'idle' ? (
                        <>
                            <label className="dropzone">
                                {photo ? <><img src={photo} alt="Uploaded plant" /><p className="muted" style={{ marginTop: 8 }}>Photo ready; click Analyze Plant.</p></> : <><strong>Drag & drop a photo here</strong><p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Get an AI-powered analysis of your plant's health.</p></>}
                                <input type="file" accept="image/*" hidden onChange={(event) => readFile(event.currentTarget.files?.[0]).then(setPhoto)} />
                            </label>
                            <div className="modal-actions">
                                <button className="btn btn-primary" type="button" disabled={!photo} onClick={analyze}>Analyze Plant</button>
                                <button className="btn btn-secondary" type="button" onClick={() => {
                                    retry();
                                    if (onClose) onClose();
                                }}>Cancel</button>
                            </div>
                        </>
                    ) : null}
                    {phase === 'loading' ? (
                        <>
                            <p style={{ textAlign: 'center', fontWeight: 600 }}>Analyzing your plant photo...</p>
                            <div className="loading-bar"><div className="loading-bar-fill" style={{ width: `${barWidth}%` }}></div></div>
                            <p className="muted" style={{ textAlign: 'center', fontSize: 12.5 }}>This may take a moment...</p>
                        </>
                    ) : null}
                    {phase === 'done' && result ? (
                        <>
                            <div className="diag-result">
                                <p style={{ fontSize: 15 }}><strong>Diagnosis Result:</strong> {result}</p>
                                {result === "The image must be plant" && (
                                    <>
                                        <p style={{ color: 'var(--brick-500)', marginTop: 8, fontSize: 13 }}>
                                            The image doesn't appear to contain a plant. Please try another photo with a clear view of a plant.
                                        </p>
                                    </>
                                )}
                                {result !== "The image must be plant" && (
                                    <>
                                        <p style={{ marginTop: 12, fontSize: 13 }}>
                                            Based on the analysis, your plant appears to be: <strong style={{ textTransform: 'capitalize' }}>{result}</strong>
                                        </p>
                                        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-600)' }}>
                                            This assessment can help you update your plant's health status in the Health or Plant Detail pages.
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" type="button" onClick={retry}>Try Another Photo</button>
                                {result !== "The image must be plant" && (
                                    <>
                                        <button className="btn btn-primary" type="button" onClick={updateHealth}>Update Health</button>
                                        <button className="btn btn-secondary" type="button" onClick={() => {
                                            retry();
                                            if (onClose) onClose();
                                        }}>Cancel</button>
                                    </>
                                )}
                            </div>
                        </>
                    ) : null}
                    {phase === 'error' && error ? (
                        <>
                            <p style={{ textAlign: 'center', color: 'var(--brick-500)' }}>
                                Analysis failed: {error}
                            </p>
                            <div className="modal-actions">
                                <button className="btn btn-secondary" type="button" onClick={retry}>Try Again</button>
                            </div>
                        </>
                    ) : null}
                </form>
            </div>
        </div>
    )
}