"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Target, TrendingUp, Calendar, Home, CheckSquare, BarChart3, Lightbulb, Bell } from "lucide-react"
import AddHabitForm from "@/components/add-habit-form"
import HabitList from "@/components/habit-list"
import DailyCheckin from "@/components/daily-checkin"
import HabitMetrics from "@/components/habit-metrics"
import TipsAdvice from "@/components/tips-advice"
import MobileNavigation from "@/components/mobile-navigation"
import { supabase } from "@/lib/supabase"

type ActionItem = { text: string; completed?: boolean } | string

type Habit = {
  id: string | number
  user_id?: string
  name: string
  type: "start" | "stop"
  description?: string | null
  category?: string | null
  difficulty?: string | null
  actionItems: ActionItem[]
  streak: number
  progress: { date: string; completed: boolean }[]
  completionRate: number
  created_at?: string
  updated_at?: string
}

type NewHabit = {
  name: string
  type: "start" | "stop"
  description?: string | null
  category?: string | null
  difficulty?: string | null
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddForm, setShowAddForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Auth: Listen for user session
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
      setLoading(false)
    }
    getUser()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  // Fetch habits and progress for current user
  useEffect(() => {
    if (!user) {
      setHabits([])
      return
    }
    const fetchHabitsAndProgress = async () => {
      setLoading(true)
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (habitsError || !habitsData) {
        setHabits([])
        setLoading(false)
        return
      }

      // Fetch all progress for this user
      const { data: progressData } = await supabase
        .from("habit_progress")
        .select("*")
        .eq("user_id", user.id)

      // Group progress by habit_id
      const progressByHabit: Record<string, { date: string; completed: boolean }[]> = {}
      if (progressData) {
        for (const entry of progressData) {
          if (!progressByHabit[entry.habit_id]) progressByHabit[entry.habit_id] = []
          progressByHabit[entry.habit_id].push({
            date: entry.date,
            completed: entry.completed,
          })
        }
      }

      setHabits(
        habitsData.map((h) => ({
          ...h,
          actionItems: Array.isArray(h.action_items)
            ? h.action_items.map((item: any) =>
                typeof item === "string"
                  ? item
                  : typeof item === "object" && item !== null && "text" in item
                  ? item
                  : typeof item === "undefined"
                  ? ""
                  : String(item)
              )
            : [],
          progress: progressByHabit[h.id] || [],
          completionRate: h.completion_rate ?? calculateCompletionRate(progressByHabit[h.id] || []),
          streak: calculateStreak(progressByHabit[h.id] || []),
        }))
      )
      setLoading(false)
    }
    fetchHabitsAndProgress()
  }, [user])

  // Responsive check
  useEffect(() => {
    if (typeof window === "undefined") return
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Add new habit for current user
  const addHabit = async (newHabit: NewHabit) => {
    if (!user) return
    const actionItems = generateActionItems(newHabit.name, newHabit.type)
    const habit = {
      ...newHabit,
      user_id: user.id,
      action_items: actionItems,
      streak: 0,
      completion_rate: 0,
    }
    const { data, error } = await supabase.from("habits").insert([habit]).select()
    if (!error && data) {
      setHabits((prev) => [
        ...prev,
        ...data.map((h) => ({
          ...h,
          actionItems: Array.isArray(h.action_items)
            ? h.action_items.map((item: any) =>
                typeof item === "string" || typeof item === "object"
                  ? item
                  : typeof item === "undefined"
                  ? ""
                  : String(item)
              )
            : [],
          progress: [],
          completionRate: h.completion_rate ?? 0,
          streak: 0,
        })),
      ])
    }
    setShowAddForm(false)
  }

  // Update habit progress for current user
  const updateHabitProgress = async (habitId: string, progressEntry: { date: string; completed: boolean }) => {
    if (!user) return
    // Insert new progress entry into habit_progress
    const { error } = await supabase.from("habit_progress").insert([
      {
        habit_id: habitId,
        user_id: user.id,
        date: progressEntry.date,
        completed: progressEntry.completed,
      },
    ])
    if (!error) {
      // Update UI state locally for better UX
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId
            ? {
                ...h,
                progress: [...(h.progress ?? []), progressEntry],
                streak: calculateStreak([...(h.progress ?? []), progressEntry]),
                completionRate: calculateCompletionRate([...(h.progress ?? []), progressEntry]),
              }
            : h
        )
      )
      // Optionally, update streak and completion_rate in habits table
      const habit = habits.find((h) => h.id === habitId)
      const newProgress = [...(habit?.progress ?? []), progressEntry]
      const streak = calculateStreak(newProgress)
      const completion_rate = calculateCompletionRate(newProgress)
      await supabase
        .from("habits")
        .update({ streak, completion_rate })
        .eq("id", habitId)
        .eq("user_id", user.id)
    }
  }

  // Auth: Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  // Auth: Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setHabits([])
  }

  // Helpers
  function generateActionItems(habitName: string, type: "start" | "stop") {
    const actionTemplates = {
      start: [
        `Set a specific time each day for ${habitName.toLowerCase()}`,
        `Create a reminder or alarm for ${habitName.toLowerCase()}`,
        `Prepare necessary materials or environment`,
        `Start with just 5-10 minutes daily`,
        `Track your progress in a visible place`,
      ],
      stop: [
        `Identify triggers that lead to ${habitName.toLowerCase()}`,
        `Replace the habit with a positive alternative`,
        `Remove temptations from your environment`,
        `Find an accountability partner`,
        `Reward yourself for each day without the habit`,
      ],
    }
    return actionTemplates[type] || []
  }

  function calculateStreak(progress: { date: string; completed: boolean }[]): number {
    if (!progress || progress.length === 0) return 0
    let streak = 0
    const today = new Date()
    for (let i = progress.length - 1; i >= 0; i--) {
      const entryDate = new Date(progress[i].date)
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff === streak && progress[i].completed) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  function calculateCompletionRate(progress: { date: string; completed: boolean }[]): number {
    if (!progress || progress.length === 0) return 0
    const completed = progress.filter((p) => p.completed).length
    return Math.round((completed / progress.length) * 100)
  }

  function getTodaysHabits(): Habit[] {
    const today = new Date().toDateString()
    return habits.filter((habit) => {
      const todayProgress = (habit.progress ?? []).find((p) => new Date(p.date).toDateString() === today)
      return !todayProgress
    })
  }

  function getOverallStats() {
    const totalHabits = habits.length
    const activeHabits = habits.filter((h) => h.streak > 0).length
    const avgCompletionRate =
      habits.length > 0
        ? Math.round(habits.reduce((sum, h) => sum + (h.completionRate ?? 0), 0) / habits.length)
        : 0
    return { totalHabits, activeHabits, avgCompletionRate }
  }

  const stats = getOverallStats()
  const todaysHabits = getTodaysHabits()
  const recentHabits = useMemo(() => habits.slice(-3), [habits])

  const navigationItems = [
    { id: "overview", label: "Home", icon: Home },
    {
      id: "checkin",
      label: "Check-in",
      icon: CheckSquare,
      badge: todaysHabits.length > 0 ? todaysHabits.length : null,
    },
    { id: "habits", label: "Habits", icon: Target },
    { id: "metrics", label: "Stats", icon: BarChart3 },
    { id: "tips", label: "Tips", icon: Lightbulb },
  ]

  // UI: Auth form
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authMsg, setAuthMsg] = useState("")

  const renderAuth = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-2 text-center">Sign in to Habit Tracker</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setAuthMsg("Signing in...")
            const error = await signIn(email, password)
            if (error) {
              setAuthMsg(error.message || "Sign in failed.")
            } else {
              setAuthMsg("")
            }
          }}
        >
          <input
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
        {authMsg && <p className="text-xs text-center mt-2 text-gray-600">{authMsg}</p>}
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4 pb-20">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4">
                <div className="text-center">
                  <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHabits}</p>
                  <p className="text-xs text-gray-600">Habits</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats.activeHabits}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{stats.avgCompletionRate}%</p>
                  <p className="text-xs text-gray-600">Success</p>
                </div>
              </Card>
            </div>

            {/* Daily Check-in Alert */}
            {todaysHabits.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-orange-600" />
                      <div>
                        <h3 className="font-semibold text-orange-900 text-sm">Daily Reminder</h3>
                        <p className="text-orange-700 text-xs">{todaysHabits.length} habits to check</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Habits */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-sm">Recent Habits</h3>
                {recentHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{habit.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={habit.type === "start" ? "default" : "destructive"} className="text-xs">
                          {habit.type === "start" ? "Start" : "Stop"}
                        </Badge>
                        <span className="text-xs text-gray-500">{habit.streak} days</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{habit.completionRate ?? 0}%</p>
                      <Progress value={habit.completionRate ?? 0} className="w-12 h-1.5 mt-1" />
                    </div>
                  </div>
                ))}
                {habits.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No habits yet</p>
                    <Button onClick={() => setShowAddForm(true)} size="sm" className="mt-3">
                      Add Your First Habit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <TipsAdvice habits={habits} />
          </div>
        )
      case "habits":
        return (
          <div className="pb-20">
            <HabitList habits={habits} setHabits={setHabits} />
          </div>
        )
      case "checkin":
        return (
          <div className="pb-20">
            <DailyCheckin habits={habits} onUpdateProgress={updateHabitProgress} />
          </div>
        )
      case "metrics":
        return (
          <div className="pb-20">
            <HabitMetrics habits={habits} />
          </div>
        )
      case "tips":
        return (
          <div className="pb-20">
            <TipsAdvice habits={habits} detailed={true} />
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return renderAuth()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Habit Tracker</h1>
            <p className="text-xs text-gray-600">Build better habits daily</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(true)} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
            <Button onClick={signOut} size="sm" variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">{renderContent()}</div>

      {/* Mobile Navigation */}
      <MobileNavigation items={navigationItems} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Habit Form */}
      {showAddForm && <AddHabitForm onAddHabit={addHabit} onClose={() => setShowAddForm(false)} />}
    </div>
  )
}
