"use client"

import { useState, useEffect } from "react"

type Project = {
  id: string
  name: string
  color: string | null
  monday_sub_tasks: { id: string; name: string }[]
}

type Props = {
  date: string
  onClose: () => void
  onSaved: () => void
  editEntry?: {
    id: string
    hours: number
    note: string | null
    project_id: string
    monday_sub_task_id: string | null
  }
}

export function TimeEntryForm({ date, onClose, onSaved, editEntry }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState(editEntry?.project_id ?? "")
  const [subTaskId, setSubTaskId] = useState(editEntry?.monday_sub_task_id ?? "")
  const [hours, setHours] = useState(editEntry?.hours?.toString() ?? "")
  const [note, setNote] = useState(editEntry?.note ?? "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(setProjects)
  }, [])

  const selectedProject = projects.find(p => p.id === projectId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      projectId,
      mondaySubTaskId: subTaskId || null,
      date,
      hours: parseFloat(hours),
      note: note || null,
    }

    if (editEntry) {
      await fetch(`/api/time-entries/${editEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: payload.hours, note: payload.note, mondaySubTaskId: payload.mondaySubTaskId }),
      })
    } else {
      await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  const dateLabel = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long"
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {editEntry ? "Modifier" : "Ajouter"} des heures
        </h3>
        <p className="text-sm text-gray-400 mb-5 capitalize">{dateLabel}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Projet</label>
            <select
              value={projectId}
              onChange={e => { setProjectId(e.target.value); setSubTaskId("") }}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un projet</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProject && selectedProject.monday_sub_tasks.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Sous-tâche</label>
              <select
                value={subTaskId}
                onChange={e => setSubTaskId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucune</option>
                {selectedProject.monday_sub_tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Heures</label>
            <input
              type="number"
              value={hours}
              onChange={e => setHours(e.target.value)}
              min="0.25"
              max="24"
              step="0.25"
              required
              placeholder="ex. 2.5"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Note <span className="text-gray-300">(optionnel)</span></label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contexte, détail..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : editEntry ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
