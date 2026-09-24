import { useState } from 'react'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'

export function AdminPage({ section = 'database' }) {
  return (
    <section className="page active">
      <div className="page-head">
        <div>
          <h1>{sectionTitle(section)}</h1>
          <p className="muted">{sectionSubtitle(section)}</p>
        </div>
      </div>
      <div className="admin-panel">
        {section === 'database' ? <DatabasePanel /> : null}
        {section === 'reports' ? <ReportsPanel /> : null}
        {section === 'templates' ? <TemplatesPanel /> : null}
        {section === 'system' ? <SystemPanel /> : null}
      </div>
    </section>
  )
}

function sectionTitle(section) {
  return {
    database: 'Plant Database',
    reports: 'User Reports',
    templates: 'Notification Templates',
    system: 'System Settings',
  }[section] ?? 'Admin Console'
}

function sectionSubtitle(section) {
  return {
    database: 'Add, edit, or remove species from the plant library reference list.',
    reports: 'Review and resolve user-submitted reports and feedback.',
    templates: 'Manage the notification message templates sent to users.',
    system: 'Configure platform-wide parameters and prototype data.',
  }[section] ?? ''
}

function DatabasePanel() {
  const { state, actions } = useGreenCare()
  const [search, setSearch] = useState('')
  const query = search.toLowerCase()
  const species = state.library.filter(
    (item) =>
      !query ||
      item.common.toLowerCase().includes(query) ||
      item.scientific.toLowerCase().includes(query),
  )

  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <span data-icon="search" />
          <input
            type="search"
            placeholder="Search species..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={() => actions.openModal('speciesAdmin')}
        >
          + Add Species
        </button>
      </div>
      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Common Name</th>
              <th>Scientific Name</th>
              <th>Difficulty</th>
              <th>Light</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {species.map((item) => (
              <tr key={item.id}>
                <td>{item.common}</td>
                <td style={{ fontStyle: 'italic' }}>{item.scientific}</td>
                <td>{item.difficulty}</td>
                <td>{item.light}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => actions.openModal('speciesAdmin', { speciesId: item.id })}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() =>
                      actions.openModal('confirmDeleteSpecies', { speciesId: item.id })
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!species.length ? (
              <tr>
                <td colSpan="5" className="muted">
                  No species found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ReportsPanel() {
  const { state, actions } = useGreenCare()
  const openCount = state.adminReports.filter((r) => r.status === 'open').length
  return (
    <>
      {openCount > 0 && (
        <div className="admin-alert-banner">
          <span>⚠</span>
          <span>
            <strong>{openCount} open report{openCount > 1 ? 's' : ''}</strong> awaiting review.
          </span>
        </div>
      )}
      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Detail</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.adminReports.map((report) => (
              <tr key={report.id}>
                <td>
                  <strong style={{ fontSize: 13 }}>{report.subject}</strong>
                </td>
                <td className="muted">{report.detail}</td>
                <td>
                  <span
                    className={`badge ${
                      report.status === 'open'
                        ? 'badge-today'
                        : report.status === 'resolved'
                          ? 'badge-healthy'
                          : 'badge-upcoming'
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => actions.updateReport(report.id, 'resolved')}
                  >
                    Resolve
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => actions.updateReport(report.id, 'dismissed')}
                  >
                    Dismiss
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function TemplatesPanel() {
  const { actions } = useGreenCare()
  const templates = [
    {
      name: 'Watering Reminder',
      trigger: 'On scheduled watering day',
      body: '🌱 {plant} needs watering today.',
    },
    {
      name: 'Fertilizing Reminder',
      trigger: 'On scheduled fertilizing day',
      body: '🌿 {plant} fertilizer is due {date}.',
    },
    {
      name: 'Overdue Alert',
      trigger: 'When task is overdue',
      body: '⚠ {plant} has not been checked recently.',
    },
    {
      name: 'Health Alert',
      trigger: 'On health status change',
      body: '{plant} is showing signs it needs attention.',
    },
  ]
  return (
    <div className="card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Template Name</th>
            <th>Trigger</th>
            <th>Message Body</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.name}>
              <td>
                <strong style={{ fontSize: 13 }}>{template.name}</strong>
              </td>
              <td className="muted" style={{ fontSize: 12.5 }}>
                {template.trigger}
              </td>
              <td className="muted">{template.body}</td>
              <td style={{ textAlign: 'right' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() =>
                    actions.openModal('noop', {
                      message:
                        'Template editing is simulated in this frontend prototype.',
                    })
                  }
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SystemPanel() {
  const { state, actions } = useGreenCare()
  return (
    <div className="settings-grid">
      <div className="card">
        <div className="card-head">
          <h3>System Parameters</h3>
        </div>
        <ReadonlyToggle label="Allow new user registration" checked />
        <ReadonlyToggle label="Enable plant diagnosis feature" checked />
        <ReadonlyToggle label="Send weekly report emails" />
      </div>
      <div className="card">
        <div className="card-head">
          <h3>Database Snapshot</h3>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          {state.library.length} species &middot; {state.plants.length} user plants tracked &middot;{' '}
          {state.tasks.length} scheduled tasks
        </p>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          style={{ marginTop: 12 }}
          onClick={() => actions.openModal('confirmReset')}
        >
          Reset Prototype Data
        </button>
      </div>
    </div>
  )
}

function ReadonlyToggle({ label, checked = false }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <label className="switch">
        <input type="checkbox" checked={checked} readOnly />
        <span className="slider" />
      </label>
    </div>
  )
}
