"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type KPIs = {
  todayCheckIns: number
  weekCheckIns: number
  totalCheckIns: number
  totalCustomers: number
  weekInspections: number
  vehiclesServedThisMonth: number
}

type Insights = {
  failureRate: number
  avgPhotos: string
  topMake: { make: string; count: number } | null
  repeatCustomers: number
  busiestDay: string | null
}

type ActivityItem = {
  type: "check_in" | "inspection"
  id: string
  name: string
  vehicle: string
  created_at: string
}

type ScheduleItem = {
  id: string
  task: string
  status: string
  due_date: string
  start_time: string | null
  end_time: string | null
  assigned_to: string | null
  shop_customers: { first_name: string; last_name: string } | null
  vehicles: { year: string | null; make: string | null; model: string | null } | null
}

type DashboardData = {
  kpis: KPIs
  insights: Insights
  recentActivity: ActivityItem[]
  todaySchedule: ScheduleItem[]
  upcomingSchedule: ScheduleItem[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "same-origin" })
      if (res.status === 401) {
        router.push("/admin/login")
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatScheduleTime = (time: string | null) => {
    if (!time) return "All day"
    const [h, m] = time.split(":")
    const hour = parseInt(h)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${m} ${ampm}`
  }

  // Styles
  const cardClass = "rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
  const kpiValueClass = "mt-2 text-3xl font-bold text-foreground"
  const kpiLabelClass = "text-xs font-medium uppercase tracking-wider text-muted-foreground"
  const kpiSubtextClass = "mt-1 text-xs text-muted-foreground"
  const accentKpiValueClass = "mt-2 text-3xl font-bold text-accent"

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    )
  }

  const { kpis, insights, recentActivity, todaySchedule, upcomingSchedule } = data

  return (
    <div className="min-h-full p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Hub Tire Shop Operations Center</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end text-right">
            <p className="text-sm font-medium text-foreground">{formatDate(currentTime)}</p>
            <p className="text-xs text-muted-foreground">{formatTime(currentTime)}</p>
          </div>
          <button
            onClick={() => { setLoading(true); load() }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Refresh"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className={cardClass}>
          <p className={kpiLabelClass}>Today Check-Ins</p>
          <p className={accentKpiValueClass}>{kpis.todayCheckIns}</p>
          <p className={kpiSubtextClass}>check-ins</p>
        </div>
        <div className={cardClass}>
          <p className={kpiLabelClass}>This Week</p>
          <p className={kpiValueClass}>{kpis.weekCheckIns}</p>
          <p className={kpiSubtextClass}>check-ins</p>
        </div>
        <div className={cardClass}>
          <p className={kpiLabelClass}>Total Check-Ins</p>
          <p className={kpiValueClass}>{kpis.totalCheckIns}</p>
          <p className={kpiSubtextClass}>all time</p>
        </div>
        <div className={cardClass}>
          <p className={kpiLabelClass}>Total Customers</p>
          <p className={kpiValueClass}>{kpis.totalCustomers}</p>
          <p className={kpiSubtextClass}>unique</p>
        </div>
        <div className={cardClass}>
          <p className={kpiLabelClass}>Inspections</p>
          <p className={kpiValueClass}>{kpis.weekInspections}</p>
          <p className={kpiSubtextClass}>this week</p>
        </div>
        <div className={cardClass}>
          <p className={kpiLabelClass}>Vehicles Served</p>
          <p className={kpiValueClass}>{kpis.vehiclesServedThisMonth}</p>
          <p className={kpiSubtextClass}>this month</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/checkin"
            target="_blank"
            className="flex flex-col items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 p-4 text-center transition-colors hover:border-accent hover:bg-accent/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">New Check-In</span>
          </Link>
          <Link
            href="/inspection"
            target="_blank"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-accent/30 hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">New Inspection</span>
          </Link>
          <Link
            href="/admin/calendar"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-accent/30 hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">Calendar</span>
          </Link>
          <Link
            href="/admin/customers"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-accent/30 hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">Customers</span>
          </Link>
          <Link
            href="/admin/check-ins"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-accent/30 hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">Check-Ins</span>
          </Link>
          <Link
            href="/admin/inspections"
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-accent/30 hover:bg-secondary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">Inspections</span>
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-sans text-sm font-semibold text-foreground">Recent Activity</h2>
              <div className="flex gap-2">
                <Link href="/admin/check-ins" className="text-xs font-medium text-accent hover:underline">
                  Check-Ins
                </Link>
                <span className="text-muted-foreground">|</span>
                <Link href="/admin/inspections" className="text-xs font-medium text-accent hover:underline">
                  Inspections
                </Link>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentActivity.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.type === "check_in" ? `/admin/check-ins` : `/admin/inspections`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/50"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      item.type === "check_in" 
                        ? "bg-blue-500/10 text-blue-500" 
                        : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {item.type === "check_in" ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.vehicle}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        item.type === "check_in"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {item.type === "check_in" ? "Check-In" : "Inspection"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatActivityTime(item.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Business Insights */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-sans text-sm font-semibold text-foreground">Business Insights</h2>
            </div>
            <div className="divide-y divide-border/50">
              {insights.topMake && (
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Top Brand This Month</p>
                      <p className="text-sm font-medium text-foreground">{insights.topMake.make}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-accent">{insights.topMake.count}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Repeat Customers</p>
                    <p className="text-sm font-medium text-foreground">{insights.repeatCustomers} customers</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Photos/Check-In</p>
                    <p className="text-sm font-medium text-foreground">{insights.avgPhotos} photos</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inspection Failure Rate</p>
                    <p className="text-sm font-medium text-foreground">{insights.failureRate}% items failed</p>
                  </div>
                </div>
              </div>
              {insights.busiestDay && (
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Busiest Day</p>
                      <p className="text-sm font-medium text-foreground">{insights.busiestDay}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-sans text-sm font-semibold text-foreground">Today&apos;s Schedule</h2>
              <Link href="/admin/calendar" className="text-xs font-medium text-accent hover:underline">
                Open Calendar
              </Link>
            </div>
            {todaySchedule.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">No appointments today</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {todaySchedule.map((wo) => (
                  <Link
                    key={wo.id}
                    href="/admin/calendar"
                    className="block px-5 py-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-foreground">{wo.task}</p>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {formatScheduleTime(wo.start_time)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {wo.shop_customers
                        ? `${wo.shop_customers.first_name} ${wo.shop_customers.last_name}`
                        : "No customer"}
                      {wo.vehicles && ` • ${[wo.vehicles.year, wo.vehicles.make, wo.vehicles.model].filter(Boolean).join(" ")}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule */}
          {upcomingSchedule.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-sans text-sm font-semibold text-foreground">Upcoming</h2>
              </div>
              <div className="divide-y divide-border/50">
                {upcomingSchedule.map((wo) => (
                  <Link
                    key={wo.id}
                    href="/admin/calendar"
                    className="block px-5 py-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-foreground">{wo.task}</p>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {new Date(wo.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {wo.shop_customers
                        ? `${wo.shop_customers.first_name} ${wo.shop_customers.last_name}`
                        : "No customer"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
