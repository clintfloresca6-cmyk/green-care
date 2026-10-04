import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { fmtDate } from '../../shared/utils/date.js'
import { activityIcon } from '../../shared/utils/plants.js'
import { useState, useEffect } from 'react'
import { Modal } from './Modal.jsx'

export function JournalPage() {
  const { state, actions } = useGreenCare()
  const [modalOpen, setModalOpen] = useState(false)

  // Log when journal entries are fetched (i.e., when state.journal changes)
  useEffect(() => {
    console.log('Journal entries fetched:', state.journal)
  }, [state.journal])
  const entries = [...state.journal].sort((a, b) => {
    // Handle null/undefined dates - treat them as empty strings for sorting
    const dateA = a.date || ''
    const dateB = b.date || ''
    return dateB.localeCompare(dateA)
  })

  // Handle modal state from the global modal system
  // We'll use this to sync with the direct modal state for consistency
  // But we prioritize the direct state for reliability

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>Care Journal</h1>
          <p className="muted">A running log of everything you do for your plants.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => {
          setModalOpen(true)
          console.log(modalOpen)
        }}>+ New Entry</button>
      </div>
      <div className="journal-timeline">
        {entries.length ? entries.map((entry) => {
          const plant = state.plants.find((item) => item.id === entry.plantId)
          return (
            <div className="journal-entry" key={entry.id}>
              <div className="journal-icon">{activityIcon(entry.activity)}</div>
              <div>
                <div className="journal-date">{fmtDate(entry.date) || 'Date not available'}</div>
                <div className="journal-title">{entry.activity} {plant?.name || '(archived plant)'}</div>
                <div className="journal-notes">{entry.notes}</div>
                {entry.photo ? <div className="journal-thumb"><img src={entry.photo} alt="" /></div> : null}
              </div>
            </div>
          )
        }) : <div className="empty-state"><h3>No journal entries yet</h3><p>Log your first care activity to start your plant's story.</p></div>}
      </div>
      {/* Direct modal rendering as fallback - only show if button was clicked */}
      {modalOpen && (
        <Modal
          preselectPlantId={state.plants[0]?.id}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  )
}