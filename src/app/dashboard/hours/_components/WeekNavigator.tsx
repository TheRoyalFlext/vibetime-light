"use client"

import { formatWeekRange, getWeekStart, toDateString } from "@/lib/week"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function WeekNavigator({ weekStart }: { weekStart: Date }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = useCallback((delta: number) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + delta * 7)
    const params = new URLSearchParams(searchParams.toString())
    params.set("week", toDateString(d))
    router.push(`?${params.toString()}`)
  }, [weekStart, router, searchParams])

  const isCurrentWeek = toDateString(weekStart) === toDateString(getWeekStart(new Date()))

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(-1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <span className="text-sm font-medium text-gray-900 min-w-[180px] text-center">
        {formatWeekRange(weekStart)}
      </span>

      <button
        onClick={() => navigate(1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {!isCurrentWeek && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set("week", toDateString(getWeekStart(new Date())))
            router.push(`?${params.toString()}`)
          }}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-1"
        >
          Aujourd'hui
        </button>
      )}
    </div>
  )
}
