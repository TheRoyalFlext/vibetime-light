"use client"

import { useState, useEffect } from "react"

type Column = { id: string; title: string; type: string }
type Config = { board_id: string; hours_column_id: string | null; last_synced_at: string | null }

export default function MondayAdminPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [boardId, setBoardId] = useState("")
  const [columns, setColumns] = useState<Column[]>([])
  const [hoursColumnId, setHoursColumnId] = useState("")
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ projectsCreated: number; subTasksCreated: number } | null>(null)

  useEffect(() => {
    fetch("/api/monday/config").then(r => r.json()).then((data: Config) => {
      if (data) {
        setConfig(data)
        setBoardId(data.board_id)
        setHoursColumnId(data.hours_column_id ?? "")
        if (data.board_id) loadColumns(data.board_id)
      }
    })
  }, [])

  async function loadColumns(id: string) {
    const res = await fetch(`/api/monday/columns?boardId=${id}`)
    const data = await res.json()
    setColumns(Array.isArray(data) ? data : [])
  }

  async function handleSave() {
    setSaving(true)
    await fetch("/api/monday/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, hoursColumnId: hoursColumnId || null }),
    })
    setSaving(false)
    await loadColumns(boardId)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch("/api/monday/sync", { method: "POST" })
    const data = await res.json()
    setSyncResult(data)
    setSyncing(false)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Connexion Monday</h1>
      <p className="text-sm text-gray-400 mb-8">Configure le board Monday à connecter à Vibetime.</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
        {/* Board ID */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">ID du Board Monday</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={boardId}
              onChange={e => setBoardId(e.target.value)}
              placeholder="ex. 1234567890"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => loadColumns(boardId)}
              disabled={!boardId}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Charger
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Trouve l'ID dans l'URL de ton board Monday : monday.com/boards/<strong>1234567890</strong>
          </p>
        </div>

        {/* Colonne heures */}
        {columns.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Colonne "Heures loggées"</label>
            <select
              value={hoursColumnId}
              onChange={e => setHoursColumnId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une colonne</option>
              {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <p className="text-[11px] text-gray-400 mt-1.5">Colonne numérique qui recevra les heures loggées par designer.</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !boardId}
          className="w-full py-2.5 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {/* Sync */}
      {config?.board_id && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Synchroniser les projets</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Importe les items et sous-items du board comme projets dans Vibetime.
                {config.last_synced_at && (
                  <> Dernière sync : {new Date(config.last_synced_at).toLocaleString("fr-FR")}</>
                )}
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {syncing ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="12"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12 7A5 5 0 1 1 7 2M7 2l2-2M7 2l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Synchroniser
            </button>
          </div>

          {syncResult && (
            <div className="bg-emerald-50 text-emerald-700 text-xs px-3 py-2.5 rounded-xl">
              ✓ {syncResult.projectsCreated} projets · {syncResult.subTasksCreated} sous-tâches importés
            </div>
          )}
        </div>
      )}

      {/* Webhook info */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 mt-4">
        <p className="text-xs font-medium text-gray-700 mb-1">URL Webhook Monday</p>
        <code className="text-[11px] text-gray-500 break-all">
          {typeof window !== "undefined" ? window.location.origin : "https://ton-domaine.vercel.app"}/api/monday/webhook
        </code>
        <p className="text-[11px] text-gray-400 mt-2">
          Ajoute cette URL dans Monday → Intégrations → Webhooks pour la sync en temps réel.
        </p>
      </div>
    </div>
  )
}
