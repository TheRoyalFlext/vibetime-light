"use client"

import { useState, useCallback } from "react"
import { toDateString } from "@/lib/week"
import { weekCapacityHours } from "@/lib/capacity"
import { AllocationForm } from "./AllocationForm"
import type { WorkSchedule } from "@/types"

type Allocation = {
  id: string
  planned_hours: number
  project_id: string
  projects: { id: string; name: string; color: string | null }
}

type Designer = {
  id: string
  name: string | null
  image: string | null
  work_schedule: WorkSchedule | null
  allocations: Allocation[]
}

type Props = {
  designers: Designer[]
  weekStart: Date
}

const BADGE_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
]

function colorForProject(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return BADGE_COLORS[hash % BADGE_COLORS.length]
}

export function PlanningBoard({ designers: initial, weekStart }: Props) {
  const [designers, setDesigners] = useState(initial)
  const [form, setForm] = useState<{ userId?: string; edit?: Allocation & { userId: string } } | null>(null)
  const weekStartStr = toDateString(weekStart)

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/allocations?weekStart=${weekStartStr}`)
    const allocs: (Allocation & { users: Designer })[] = await res.json()

    setDesigners(prev => prev.map(d => ({
      ...d,
      allocations: allocs.filter(a => a.users?.id === d.id),
    })))
  }, [weekStartStr])

  async function deleteAllocation(id: string) {
    await fetch(`/api/allocations/${id}`, { method: "DELETE" })
    setDesigners(prev => prev.map(d => ({
      ...d,
      allocations: d.allocations.filter(a => a.id !== id),
    })))
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {designers.map(designer => {
          const capacity = designer.work_schedule
            ? weekCapacityHours(designer.work_schedule)
            : 35
          const allocated = designer.allocations.reduce((s, a) => s + a.planned_hours, 0)
          const ratio = Math.min(allocated / capacity, 1)
          const isOver = allocated > capacity

          return (
            <div key={designer.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                {designer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={designer.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-gray-500">
                      {designer.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{designer.name ?? "—"}</span>
                    <span className={`text-xs font-semibold ${isOver ? "text-red-500" : "text-gray-400"}`}>
                      {allocated}h / {capacity}h
                    </span>
                  </div>
                  {/* Capacity bar */}
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : "bg-emerald-400"}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Conflict warning */}
              {isOver && (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L11 10H1L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M6 5v2M6 8.5h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Surcharge de {(allocated - capacity).toFixed(1)}h cette semaine
                </div>
              )}

              {/* Allocations */}
              <div className="flex flex-wrap gap-2">
                {designer.allocations.map(alloc => (
                  <div
                    key={alloc.id}
                    className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer hover:shadow-sm transition-all ${colorForProject(alloc.project_id)}`}
                    onClick={() => setForm({ edit: { ...alloc, userId: designer.id } })}
                  >
                    <span className="truncate max-w-[120px]">{alloc.projects.name}</span>
                    <span className="opacity-60">·</span>
                    <span>{alloc.planned_hours}h</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteAllocation(alloc.id) }}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 text-current hover:opacity-100 transition-opacity"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M8 2L2 8M2 2l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setForm({ userId: designer.id })}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-300 hover:text-gray-500 hover:border-gray-300 transition-colors"
                >
                  + Allouer
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {form && (
        <AllocationForm
          weekStart={weekStartStr}
          preselectedUserId={form.userId}
          editAllocation={form.edit ? {
            id: form.edit.id,
            plannedHours: form.edit.planned_hours,
            projectId: form.edit.project_id,
          } : undefined}
          onClose={() => setForm(null)}
          onSaved={refresh}
        />
      )}
    </>
  )
}
