"use client"

import { useState, useEffect } from "react"

type Project = { id: string; name: string }
type User = { id: string; name: string | null }

type Props = {
  weekStart: string
  preselectedUserId?: string
  editAllocation?: { id: string; plannedHours: number; projectId: string }
  onClose: () => void
  onSaved: () => void
}

export function AllocationForm({ weekStart, preselectedUserId, editAllocation, onClose, onSaved }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [userId, setUserId] = useState(preselectedUserId ?? "")
  const [projectId, setProjectId] = useState(editAllocation?.projectId ?? "")
  const [hours, setHours] = useState(editAllocation?.plannedHours?.toString() ?? "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
    ]).then(([u, p]) => { setUsers(u); setProjects(p) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (editAllocation) {
      await fetch(`/api/allocations/${editAllocation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plannedHours: parseFloat(hours) }),
      })
    } else {
      await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, projectId, plannedHours: parseFloat(hours), weekStart }),
      })
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900 mb-5">
          {editAllocation ? "Modifier l'allocation" : "Allouer du temps"}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!preselectedUserId && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Designer</label>
              <select
                value={userId}
                onChange={e => setUserId(e.target.value)}
                required
                disabled={!!editAllocation}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Sélectionner</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Projet</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              required
              disabled={!!editAllocation}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Sélectionner un projet</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Heures planifiées</label>
            <input
              type="number"
              value={hours}
              onChange={e => setHours(e.target.value)}
              min="0.5"
              step="0.5"
              required
              placeholder="ex. 14"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50">
              {loading ? "..." : editAllocation ? "Modifier" : "Allouer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
