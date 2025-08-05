"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react"

export default function HabitMetrics({ habits }) {
  const getHabitStats = (habit) => {
    const totalDays = habit.progress.length
    const completedDays = habit.progress.filter((p) => p.completed).length
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    // Calculate average rating
    const ratingsWithValues = habit.progress.filter((p) => p.rating && p.rating > 0)
    const avgRating =
      ratingsWithValues.length > 0
        ? (ratingsWithValues.reduce((sum, p) => sum + p.rating, 0) / ratingsWithValues.length).toFixed(1)
        : 0

    // Get most common mood
    const moods = habit.progress.filter((p) => p.mood).map((p) => p.mood)
    const moodCounts = moods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1
      return acc
    }, {})
    const mostCommonMood =
      Object.keys(moodCounts).length > 0
        ? Object.keys(moodCounts).reduce((a, b) => (moodCounts[a] > moodCounts[b] ? a : b))
        : null

    // Calculate consistency (days with entries in last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toDateString()
    })

    const recentEntries = habit.progress.filter((p) => last7Days.includes(new Date(p.date).toDateString())).length

    const consistency = Math.round((recentEntries / 7) * 100)

    return {
      totalDays,
      completedDays,
      completionRate,
      avgRating,
      mostCommonMood,
      consistency,
      streak: habit.streak,
    }
  }

  const getOverallMetrics = () => {
    if (habits.length === 0) return null

    const totalHabits = habits.length
    const activeHabits = habits.filter((h) => h.streak > 0).length
    const avgCompletionRate = Math.round(
      habits.reduce((sum, h) => sum + getHabitStats(h).completionRate, 0) / habits.length,
    )

    const longestStreak = Math.max(...habits.map((h) => h.streak), 0)
    const totalCheckIns = habits.reduce((sum, h) => sum + h.progress.length, 0)

    return {
      totalHabits,
      activeHabits,
      avgCompletionRate,
      longestStreak,
      totalCheckIns,
    }
  }

  const getMoodColor = (mood) => {
    const colors = {
      great: "text-green-500",
      good: "text-blue-500",
      okay: "text-yellow-500",
      difficult: "text-orange-500",
      missed: "text-red-500",
    }
    return colors[mood] || "text-gray-500"
  }

  const overallMetrics = getOverallMetrics()

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No metrics yet</h3>
          <p className="text-gray-600">Add some habits and start tracking to see your metrics!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{overallMetrics.totalHabits}</p>
              <p className="text-xs text-gray-600">Total Habits</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{overallMetrics.activeHabits}</p>
              <p className="text-xs text-gray-600">Active Streaks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{overallMetrics.longestStreak}</p>
              <p className="text-xs text-gray-600">Longest Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <BarChart3 className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-indigo-600">{overallMetrics.avgCompletionRate}%</p>
              <p className="text-xs text-gray-600">Avg. Success</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Habit Metrics */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Individual Habit Metrics</h3>

        {habits.map((habit) => {
          const stats = getHabitStats(habit)

          return (
            <Card key={habit.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {habit.name}
                    <Badge variant={habit.type === "start" ? "default" : "destructive"}>
                      {habit.type === "start" ? "Start" : "Stop"}
                    </Badge>
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{stats.streak}</p>
                    <p className="text-sm text-gray-600">day streak</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Completion Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm text-gray-600">{stats.completionRate}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.completedDays} of {stats.totalDays} days
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Consistency */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">7-Day</span>
                        <span className="text-xs text-gray-600">{stats.consistency}%</span>
                      </div>
                      <Progress value={stats.consistency} className="h-1.5" />
                    </div>

                    {/* Average Rating */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Rating</span>
                        <Badge variant="outline" className="text-xs">
                          {stats.avgRating}/5
                        </Badge>
                      </div>
                      <Progress value={(stats.avgRating / 5) * 100} className="h-1.5" />
                    </div>
                  </div>

                  {/* Most Common Mood */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Common Mood</span>
                    {stats.mostCommonMood ? (
                      <Badge variant="outline" className={`${getMoodColor(stats.mostCommonMood)} capitalize text-xs`}>
                        {stats.mostCommonMood}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 text-xs">
                        No data
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Recent Progress */}
                {habit.progress.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Recent Progress</h4>
                    <div className="flex gap-1">
                      {habit.progress.slice(-14).map((entry, index) => (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded-sm ${entry.completed ? "bg-green-500" : "bg-red-200"}`}
                          title={`${new Date(entry.date).toLocaleDateString()}: ${
                            entry.completed ? "Completed" : "Missed"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last 14 days (green = completed, red = missed)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
