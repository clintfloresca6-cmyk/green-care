import { useGreenCare } from '../context/GreenCareContext.jsx'

export function ToastHost() {
  const { state } = useGreenCare()
  const toasts = Array.isArray(state?.toasts) ? state?.toasts : []
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          <span>✓</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
