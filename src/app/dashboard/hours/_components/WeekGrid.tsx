"use client"

import { useState, useCallback } from "react"
import { formatDay, toDateString } from "@/lib/week"
import { TimeEntryForm } from "./TimeEntryForm"
import { weekCapacityHours } from "@/lib/capacity"
import type { WorkSchedule } from "@/types"

type Entry = {
  id: string
  date: string
  hours: number
  note: string | null
  project_id: string
  monday_sub_task_id: string | null
  projects: { id: string; name: string; color: string | null }
  monday_sub_tasks: { id: string; name: string } | null
}

type Props = {
  days: Date[]
  initialEntries: Entry[]
  workSchedule: WorkSchedule | null
}

const COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
]

function colorForProject(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}

export function WeekGrid({ days, initialEntries, workSchedule }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [form, setForm] = useState<{ date: string; edit?: Entry } | null>(null)

  const refresh = useCallback(async () => {
    const weekStart = toDateString(days[0])
    const res = await fetch(`/api/time-entries?weekStart=${weekStart}`)
    setEntries(await res.json())
  }, [days])

  async function deleteEntry(id: string) {
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const dayCapacity = workSchedule
    ? weekCapacityHours(workSchedule) / 5
    : 8

  const today = toDateString(new Date())

  return (
    <>
      <div className="grid grid-cols-5 gap-3">
        {days.map((day) => {
          const dateStr = toDateString(day)
          const dayEntries = entries.filter(e => e.date === dateStr)
          const totalHours = dayEntries.reduce((s, e) => s + e.hours, 0)
          const isToday = dateStr === today
          const { short, num } = formatDay(day)
          const ratio = Math.min(totalHours / dayCapacity, 1)
          const isOver = totalHours > dayCapacity

          return (
            <div key={dateStr} className="flex flex-col gap-2">
              {/* Day header */}
              <div className={`flex items-center justify-between px-1 ${isToday ? "text-blue-600" : "text-gray-400"}`}>
                <span className="text-xs font-medium capitalize">{short}</span>
                <span className={`text-xs font-semibold ${isToday ? "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center" : ""}`}>
                  {num}
                </span>
              </div>

              {/* Capacity bar */}
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : "bg-emerald-400"}`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>

              {/* Entries */}
              <div className="flex flex-col gap-1.5 min-h-[120px]">
                {dayEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="group relative rounded-xl p-2.5 bg-white border border-gray-100 hover:border-gray-200 shadow-sm cursor-pointer transition-all"
                    onClick={() => setForm({ date: dateStr, edit: entry })}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md mb-1 ${colorForProject(entry.project_id)}`}>
                          {entry.projects.name}
                        </span>
                        {entry.monday_sub_tasks && (
                          <p className="text-[11px] text-gray-500 truncate">{entry.monday_sub_tasks.name}</p>
                        )}
                        {entry.note && (
                          <p className="text-[11px] text-gray-400 truncate">{entry.note}</p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 shrink-0">{entry.hours}h</span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add button */}
                <button
                  onClick={() => setForm({ date: dateStr })}
                  className="w-full rounded-xl border border-dashed border-gray-200 py-2 text-gray-300 hover:text-gray-500 hover:border-gray-300 transition-colors text-sm"
                >
                  +
                </button>
              </div>

              {/* Day total */}
              <div className={`text-center text-xs font-medium ${isOver ? "text-red-500" : "text-gray-400"}`}>
                {totalHours > 0 ? `${totalHours}h / ${dayCapacity}h` : `—`}
              </div>
            </div>
          )
        })}
      </div>

      {form && (
        <TimeEntryForm
          date={form.date}
          editEntry={form.edit}
          onClose={() => setForm(null)}
          onSaved={refresh}
        />
      )}
    </>
  )
}
