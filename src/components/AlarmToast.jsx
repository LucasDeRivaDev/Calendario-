// src/components/AlarmToast.jsx
import { Bell } from 'lucide-react'

export function AlarmToast({ alarmEvent, onClose }) {
  if (!alarmEvent) return null

  return (
    <div className="alarm-toast" role="alert">
      <div className="alarm-icon-wrap">
        <Bell size={18} />
      </div>
      <div className="alarm-body">
        <p className="alarm-label">Recordatorio activo</p>
        <strong className="alarm-title">{alarmEvent.title}</strong>
        <span className="alarm-sub">{alarmEvent.profileName} · {alarmEvent.time}</span>
      </div>
      <button type="button" className="alarm-close" onClick={onClose}>
        Cerrar
      </button>
    </div>
  )
}
