import { useState } from 'react'
import { Avatar } from '../../shared/components/Avatar.jsx'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export function ProfilePage() {
  const { state, actions } = useGreenCare()
  const { currentUser, updateUserProfile: updateAuthUser } = useAuth()
  const [form, setForm] = useState(currentUser ? currentUser : (state.profile ?? { name: '', email: '', location: '', photo: null }))
  const [photoFile, setPhotoFile] = useState(null)

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

  async function save() {
    let photoToUpload = form.photo

    // If we have a selected file, convert it to base64 for upload
    if (photoFile) {
      try {
        const base64Image = await fileToBase64(photoFile)
        photoToUpload = base64Image // Send base64 to backend for ImgBB upload
      } catch (error) {
        console.error('Error converting image to base64:', error)
        // If conversion fails, we'll use the existing photo
        photoToUpload = form.photo
      }
    }

    // Update auth user
    updateAuthUser({
      name: form.name,
      email: form.email,
      location: form.location,
      photo: photoToUpload,
    })
    // Update GreenCare state's profile
    actions.updateProfile({
      name: (typeof form.name === 'string' ? form.name.trim() : '') || (state.profile?.name ?? ''),
      email: (typeof form.email === 'string' ? form.email.trim() : '') || (state.profile?.email ?? ''),
      location: (typeof form.location === 'string' ? form.location.trim() : '') || (state.profile?.location ?? ''),
      photo: photoToUpload ?? (state.profile?.photo ?? null),
    })

    // Reset photoFile state on success
    setPhotoFile(null)
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <section className="page active">
      <div className="page-head"><div><h1>Your Profile</h1><p className="muted">Keep your details up to date.</p></div></div>
      <div className="card profile-card">
        <div className="profile-photo-row">
          <Avatar name={form.name} photo={form.photo} size="lg" />
          <div>
            <label className="btn btn-secondary">
              Change photo
              <input type="file" accept="image/*" hidden onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  setPhotoFile(file)
                  const reader = new FileReader()
                  reader.onload = () => update('photo', URL.createObjectURL(file))
                  reader.readAsDataURL(file)
                }
              }} />
            </label>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-row"><label htmlFor="profName">Name</label><input id="profName" value={form.name} onChange={(event) => update('name', event.target.value)} /></div>
          <div className="form-row"><label htmlFor="profEmail">Email</label><input id="profEmail" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></div>
          <div className="form-row"><label htmlFor="profLocation">Location</label><input id="profLocation" value={form.location} onChange={(event) => update('location', event.target.value)} /></div>
        </div>
        <button className="btn btn-primary" type="button" onClick={save}>Save changes</button>
      </div>
    </section>
  )
}
