import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { fmtDate } from '../../shared/utils/date.js'
import { activityIcon } from '../../shared/utils/plants.js'

export function JournalPage() {
  const { state, actions } = useGreenCare()
  const entries = [...state.journal].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>Care Journal</h1>
          <p className="muted">A running log of everything you do for your plants.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => actions.openModal('journal')}>+ New Entry</button>
      </div>
      <div className="journal-timeline">
        {entries.length ? entries.map((entry) => {
          const plant = state.plants.find((item) => item.id === entry.plantId)
          return (
            <div className="journal-entry" key={entry.id}>
              <div className="journal-icon">{activityIcon(entry.activity)}</div>
              <div>
                <div className="journal-date">{fmtDate(entry.date)}</div>
                <div className="journal-title">{entry.activity} {plant?.name || '(archived plant)'}</div>
                <div className="journal-notes">{entry.notes}</div>
                {entry.photo ? <div className="journal-thumb"><img src={entry.photo} alt="" /></div> : null}
              </div>
            </div>
          )
        }) : <div className="empty-state"><h3>No journal entries yet</h3><p>Log your first care activity to start your plant's story.</p></div>}
      </div>
    </section>
  )
}
