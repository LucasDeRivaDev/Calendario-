// src/components/DetailsPanel.jsx
import { CalendarDays, MapPin, Pencil, Save, Trash2, Volume2, X } from 'lucide-react'
import { formatDateLabel } from '../hooks/useCalendar'

export function DetailsPanel({
  selectedDate,
  activeProfile,
  selectedReminders,
  selectedHolidays,
  form,
  editingReminderId,
  onUpdateForm,
  onAddReminder,
  onUpdateReminder,
  onStartEdit,
  onCancelEdit,
  onRemoveReminder,
}) {
  const isEditing = editingReminderId !== null

  return (
    <aside className="panel details-panel">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Día seleccionado</p>
          <h2>{formatDateLabel(selectedDate)}</h2>
        </div>
      </div>

      <div className="selected-profile-banner" style={{ '--profile-accent': activeProfile.color }}>
        <span className="profile-dot" />
        <div>
          <strong>{activeProfile.name}</strong>
          <small>Todo lo que agregués queda guardado solo en este perfil.</small>
        </div>
      </div>

      {selectedHolidays.length > 0 && (
        <div className="holiday-box">
          {selectedHolidays.map(h => (
            <div key={h.name} className="holiday-row">
              <CalendarDays size={15} />
              <div>
                <strong>{h.name}</strong>
                <span>{h.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="editing-banner">
          <Pencil size={12} />
          <span>
            Editando: <strong>{form.title || '…'}</strong>
          </span>
          <button
            type="button"
            className="cancel-edit-btn"
            aria-label="Cancelar edición"
            onClick={onCancelEdit}
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form className="reminder-form" onSubmit={isEditing ? onUpdateReminder : onAddReminder}>
        <label>
          Título
          <input
            type="text"
            value={form.title}
            onChange={e => onUpdateForm('title', e.target.value)}
            placeholder="Ej. Reunión con cliente"
          />
        </label>
        <div className="form-row">
          <label>
            Hora
            <input
              type="time"
              value={form.time}
              onChange={e => onUpdateForm('time', e.target.value)}
            />
          </label>
          <label>
            Lugar
            <input
              type="text"
              value={form.location}
              onChange={e => onUpdateForm('location', e.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>
        <label>
          Notas
          <textarea
            rows="3"
            value={form.notes}
            onChange={e => onUpdateForm('notes', e.target.value)}
            placeholder="Detalles, ideas, links..."
          />
        </label>
        <button type="submit" className="primary-button">
          <Save size={14} />
          {isEditing ? 'Guardar cambios' : 'Guardar recordatorio'}
        </button>
      </form>

      <div className="agenda-list">
        {selectedReminders.length === 0 ? (
          <div className="empty-state">
            <Volume2 size={17} />
            <p>No hay recordatorios para este día en este perfil.</p>
          </div>
        ) : (
          selectedReminders.map(reminder => (
            <article
              key={reminder.id}
              className={`agenda-item ${editingReminderId === reminder.id ? 'editing' : ''}`}
            >
              <div className="agenda-top">
                <div>
                  <strong>{reminder.title}</strong>
                  <span>{reminder.time}</span>
                </div>
                <div className="agenda-actions">
                  <button
                    type="button"
                    className="icon-button edit-btn"
                    aria-label={`Editar ${reminder.title}`}
                    onClick={() => onStartEdit(reminder)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-button delete-btn"
                    aria-label={`Borrar ${reminder.title}`}
                    onClick={() => onRemoveReminder(reminder.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {reminder.location && (
                <p className="agenda-meta">
                  <MapPin size={12} />
                  {reminder.location}
                </p>
              )}
              {reminder.notes && <p className="agenda-notes">{reminder.notes}</p>}
            </article>
          ))
        )}
      </div>
    </aside>
  )
}
