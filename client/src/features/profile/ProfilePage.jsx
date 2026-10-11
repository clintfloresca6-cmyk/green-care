import { useState, useEffect } from 'react'
import { Avatar } from '../../shared/components/Avatar.jsx'
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'

// Initialize form with proper defaults to prevent uncontrolled input warnings
const initialForm = {
  name: '',
  email: '',
  location: '',
  photo: null
}

export function ProfilePage() {
  const { state, actions } = useGreenCare()
  const { currentUser, updateUserProfile: updateAuthUser } = useAuth()

  const [form, setForm] = useState(initialForm)
  const [photoFile, setPhotoFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const source = currentUser ?? state.profile
    if (!source) return
    setForm({
      name: source.name ?? '',
      email: source.email ?? '',
      location: source.location ?? '',
      photo: source.photo_url ?? source.photo ?? null,
    })
  }, [currentUser, state.profile])
  
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
    setIsSaving(true)
    const payload = {
      name: form.name,
      email: form.email,
      location: form.location,
    }

    if (photoFile) {
      try {
        payload.photo = await fileToBase64(photoFile)
      } catch (err) {
        console.error('Image encode failed:', err)
        actions.toast('Could not read image file')
        setIsSaving(false)
        return
      }
    }

    try {
      // Update auth user
      const updatedUser = await updateAuthUser(payload)

      // Update GreenCare state's profile with the data from the backend
      actions.updateProfile({
        name: updatedUser.name,
        email: updatedUser.email,
        location: updatedUser.location ?? '',
        photo: updatedUser.photo_url ?? null,
      })

      // Show success toast
      actions.toast('Profile updated successfully')
    } catch (error) {
      console.error('Failed to update profile:', error)
      actions.toast('Failed to update profile. Please try again.')
    } finally {
      // Reset photoFile state on success
      setPhotoFile(null)
      setIsSaving(false)
    }
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
        <button className="btn btn-primary" type="button" disabled={isSaving} onClick={save}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </section>
  )
}
