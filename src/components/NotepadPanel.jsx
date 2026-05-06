// src/components/NotepadPanel.jsx
import { useState, useEffect, useRef } from 'react'
import { StickyNote, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'calendar_notepad'

export function NotepadPanel() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('calendar_notepad_open') === 'true' } catch { return false }
  })
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)

  // Auto-save con debounce de 800ms
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, text)
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      } catch {}
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [text])

  // Guardar estado abierto/cerrado
  useEffect(() => {
    try { localStorage.setItem('calendar_notepad_open', String(open)) } catch {}
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [open])

  function handleClear() {
    if (text.trim() === '') return
    if (confirm('¿Borrar todas las notas?')) {
      setText('')
    }
  }

  const charCount = text.length

  return (
    <div className={`notepad-panel ${open ? 'open' : ''}`}>
      {/* Barra de toggle */}
      <button
        type="button"
        className="notepad-toggle"
        onClick={() => setOpen(v => !v)}
      >
        <div className="notepad-toggle-left">
          <StickyNote size={14} />
          <span>Bloc de notas</span>
          {!open && text.trim() !== '' && (
            <span className="notepad-has-content">
              {text.trim().split('\n').filter(Boolean).length} línea{text.trim().split('\n').filter(Boolean).length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="notepad-toggle-right">
          {saved && <span className="notepad-saved">Guardado</span>}
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>

      {/* Área colapsable */}
      {open && (
        <div className="notepad-body">
          <textarea
            ref={textareaRef}
            className="notepad-textarea"
            placeholder="Anotá acá lo que quieras — ideas, pendientes, números de teléfono, lo que sea. Se guarda automáticamente."
            value={text}
            onChange={e => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="notepad-footer">
            <span className="notepad-chars">{charCount} caracteres</span>
            <button
              type="button"
              className="notepad-clear-btn"
              onClick={handleClear}
              disabled={text.trim() === ''}
              title="Borrar todo"
            >
              <Trash2 size={12} />
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
