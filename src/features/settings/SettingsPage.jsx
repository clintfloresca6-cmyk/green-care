import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'

export function SettingsPage() {
  const { state, actions } = useGreenCare()
  const settings = state.settings

  return (
    <section className="page active">
      <div className="page-head"><div><h1>Settings</h1><p className="muted">Tune GreenCare to fit how you like to work.</p></div></div>
      <div className="settings-grid">
        <div className="card">
          <div className="card-head"><h3>Notification Preferences</h3></div>
          <Toggle label="Care reminders" checked={settings.careReminders} onChange={(checked) => actions.updateSettings({ careReminders: checked })} />
          <Toggle label="Overdue reminders" checked={settings.overdueReminders} onChange={(checked) => actions.updateSettings({ overdueReminders: checked })} />
          <Toggle label="Plant health alerts" checked={settings.healthAlerts} onChange={(checked) => actions.updateSettings({ healthAlerts: checked })} />
          <Toggle label="Browser notifications" checked={settings.browserNotifs} onChange={(checked) => actions.updateSettings({ browserNotifs: checked })} />
        </div>

        <div className="card">
          <div className="card-head"><h3>Appearance</h3></div>
          <div className="toggle-row">
            <span>Theme</span>
            <div className="segmented">
              <button className={settings.theme === 'light' ? 'seg active' : 'seg'} type="button" onClick={() => actions.updateSettings({ theme: 'light' })}>Light</button>
              <button className={settings.theme === 'dark' ? 'seg active' : 'seg'} type="button" onClick={() => actions.updateSettings({ theme: 'dark' })}>Dark</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Preferences</h3></div>
          <div className="form-row">
            <label htmlFor="reminderTime">Default watering reminder time</label>
            <input id="reminderTime" type="time" value={settings.reminderTime} onChange={(event) => actions.updateSettings({ reminderTime: event.target.value })} />
          </div>
          <div className="form-row">
            <label>Start week on</label>
            <div className="segmented">
              <button className={settings.weekStart === 'mon' ? 'seg active' : 'seg'} type="button" onClick={() => actions.updateSettings({ weekStart: 'mon' })}>Monday</button>
              <button className={settings.weekStart === 'sun' ? 'seg active' : 'seg'} type="button" onClick={() => actions.updateSettings({ weekStart: 'sun' })}>Sunday</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="slider"></span>
      </label>
    </div>
  )
}
