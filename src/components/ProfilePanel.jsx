// src/components/ProfilePanel.jsx
import { Bell, CalendarDays, Check, Clock3, Plus, UserRound } from 'lucide-react'
import { SWATCH_COLORS } from '../hooks/useCalendar'

export function ProfilePanel({
  profiles,
  activeProfile,
  notificationPermission,
  pendingToday,
  monthHolidayCount,
  showProfileForm,
  newProfileName,
  onSetActiveProfile,
  onToggleProfileForm,
  onNewProfileNameChange,
  onAddProfile,
  onUpdateProfileColor,
  onRequestNotifications,
}) {
  return (
    <aside className="panel profiles-panel">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Perfiles</p>
          <h2>Mis espacios</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Agregar perfil"
          onClick={onToggleProfileForm}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="profiles-list">
        {profiles.map(profile => (
          <button
            key={profile.id}
            type="button"
            className={`profile-card ${profile.id === activeProfile.id ? 'active' : ''}`}
            onClick={() => onSetActiveProfile(profile.id)}
            style={{ '--profile-accent': profile.color }}
          >
            <span className="profile-dot" />
            <span className="profile-copy">
              <strong>{profile.name}</strong>
              <small>{profile.reminders.length} recordatorios</small>
            </span>
            <UserRound size={14} />
          </button>
        ))}
      </div>

      {showProfileForm && (
        <form className="profile-form" onSubmit={onAddProfile}>
          <label>
            Nombre del perfil
            <input
              type="text"
              value={newProfileName}
              onChange={e => onNewProfileNameChange(e.target.value)}
              placeholder="Trabajo, Familia, Estudio..."
              autoFocus
            />
          </label>
          <button type="submit" className="primary-button">Crear perfil</button>
        </form>
      )}

      <div className="color-picker-section">
        <p className="section-kicker">Color del perfil activo</p>
        <div className="color-swatches">
          {SWATCH_COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`swatch ${activeProfile.color === color ? 'selected' : ''}`}
              style={{ background: color }}
              aria-label={`Color ${color}`}
              onClick={() => onUpdateProfileColor(color)}
            />
          ))}
        </div>
      </div>

      <div className="info-stack">
        <div className="mini-stat">
          <Clock3 size={15} />
          <div>
            <span>Hoy</span>
            <strong>{pendingToday.length} eventos activos</strong>
          </div>
        </div>
        <div className="mini-stat">
          <CalendarDays size={15} />
          <div>
            <span>Mes visible</span>
            <strong>{monthHolidayCount} fechas especiales</strong>
          </div>
        </div>
      </div>

      <div className="notification-box">
        <div className="notification-copy">
          <Bell size={15} />
          <div>
            <strong>Alertas del navegador</strong>
            <span>
              {notificationPermission === 'granted' && 'Activadas'}
              {notificationPermission === 'denied' && 'Bloqueadas'}
              {notificationPermission === 'unsupported' && 'No disponibles'}
              {notificationPermission === 'default' && 'Pendientes'}
            </span>
          </div>
        </div>
        {notificationPermission === 'granted' && <Check size={14} className="notif-check" />}
        {notificationPermission === 'default' && (
          <button type="button" className="secondary-button" onClick={onRequestNotifications}>
            Activar
          </button>
        )}
      </div>
    </aside>
  )
}
