"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Smile, Meh, Frown, ThumbsUp, CheckCircle, XCircle } from "lucide-react"

export default function DailyCheckin({ habits, onUpdateProgress }) {
  const [checkinData, setCheckinData] = useState({})

  const today = new Date().toDateString()
  const todaysHabits = habits.filter((habit) => {
    const todayProgress = habit.progress.find((p) => new Date(p.date).toDateString() === today)
    return !todayProgress
  })

  const emojiOptions = [
    { icon: Smile, label: "Great", value: "great", color: "text-green-500" },
    { icon: ThumbsUp, label: "Good", value: "good", color: "text-blue-500" },
    { icon: Meh, label: "Okay", value: "okay", color: "text-yellow-500" },
    { icon: Frown, label: "Difficult", value: "difficult", color: "text-orange-500" },
    { icon: XCircle, label: "Missed", value: "missed", color: "text-red-500" },
  ]

  const faceRatings = [
    { icon: Smile, label: "Excellent", value: 5, color: "text-green-500" },
    { icon: ThumbsUp, label: "Good", value: 4, color: "text-blue-500" },
    { icon: Meh, label: "Average", value: 3, color: "text-yellow-500" },
    { icon: Frown, label: "Poor", value: 2, color: "text-orange-500" },
    { icon: XCircle, label: "Very Poor", value: 1, color: "text-red-500" },
  ]

  const updateCheckinData = (habitId, field, value) => {
    setCheckinData((prev) => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        [field]: value,
      },
    }))
  }

  const submitCheckin = (habitId) => {
    const data = checkinData[habitId] || {}
    const progressEntry = {
      date: new Date().toISOString(),
      completed: data.completed || false,
      mood: data.mood || null,
      rating: data.rating || null,
      notes: data.notes || "",
      timestamp: Date.now(),
    }

    onUpdateProgress(habitId, progressEntry)

    // Clear the form data for this habit
    setCheckinData((prev) => {
      const newData = { ...prev }
      delete newData[habitId]
      return newData
    })
  }

  if (todaysHabits.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600">You've checked in for all your habits today. Great job!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Daily Check-in</h3>
        <p className="text-gray-600">How did you do with your habits today?</p>
      </div>

      {todaysHabits.map((habit) => {
        const data = checkinData[habit.id] || {}

        return (
          <Card key={habit.id} className="mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {habit.name}
                    <Badge variant={habit.type === "start" ? "default" : "destructive"} className="text-xs">
                      {habit.type === "start" ? "Start" : "Stop"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-sm">Current streak: {habit.streak} days</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Completion Status */}
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Did you {habit.type === "start" ? "complete" : "avoid"} this habit today?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={data.completed === true ? "default" : "outline"}
                    onClick={() => updateCheckinData(habit.id, "completed", true)}
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Yes
                  </Button>
                  <Button
                    variant={data.completed === false ? "destructive" : "outline"}
                    onClick={() => updateCheckinData(habit.id, "completed", false)}
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <XCircle className="h-5 w-5" />
                    No
                  </Button>
                </div>
              </div>

              {/* Mood/Emoji Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">How did it feel?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {emojiOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.value}
                        variant={data.mood === option.value ? "default" : "outline"}
                        onClick={() => updateCheckinData(habit.id, "mood", option.value)}
                        className="flex items-center gap-2 h-12 text-sm"
                      >
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Face Rating */}
              <div>
                <Label className="text-base font-medium mb-3 block">Rate your experience (1-5)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {faceRatings.map((rating) => {
                    const Icon = rating.icon
                    return (
                      <Button
                        key={rating.value}
                        variant={data.rating === rating.value ? "default" : "outline"}
                        onClick={() => updateCheckinData(habit.id, "rating", rating.value)}
                        className="flex flex-col items-center gap-1 h-16 p-2"
                      >
                        <Icon className={`h-6 w-6 ${rating.color}`} />
                        <span className="text-xs">{rating.value}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor={`notes-${habit.id}`} className="text-base font-medium mb-3 block">
                  Notes (optional)
                </Label>
                <Textarea
                  id={`notes-${habit.id}`}
                  placeholder="How did it go? Any challenges or wins to note?"
                  value={data.notes || ""}
                  onChange={(e) => updateCheckinData(habit.id, "notes", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={() => submitCheckin(habit.id)}
                className="w-full h-12 text-base"
                disabled={data.completed === undefined}
              >
                Complete Check-in
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
