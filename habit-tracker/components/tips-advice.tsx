"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Heart, Target, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"

export default function TipsAdvice({ habits, detailed = false }) {
  const generatePersonalizedTips = () => {
    const tips = []

    // General tips for beginners
    if (habits.length === 0) {
      return [
        {
          type: "getting-started",
          icon: Target,
          title: "Start Small",
          content: "Begin with just one habit and make it so easy you can't say no. Success builds momentum!",
          color: "text-blue-600",
        },
        {
          type: "getting-started",
          icon: Lightbulb,
          title: "Stack Your Habits",
          content: "Link new habits to existing routines. After I [existing habit], I will [new habit].",
          color: "text-yellow-600",
        },
      ]
    }

    // Tips based on habit performance
    const strugglingHabits = habits.filter((h) => h.completionRate < 50)
    const successfulHabits = habits.filter((h) => h.completionRate >= 80)
    const inconsistentHabits = habits.filter((h) => h.streak < 3 && h.progress.length > 7)

    // Tips for struggling habits
    if (strugglingHabits.length > 0) {
      tips.push({
        type: "improvement",
        icon: AlertCircle,
        title: "Struggling with Some Habits?",
        content: `You have ${strugglingHabits.length} habit(s) with low success rates. Consider making them smaller or changing the timing.`,
        color: "text-orange-600",
        habits: strugglingHabits.map((h) => h.name),
      })
    }

    // Tips for successful habits
    if (successfulHabits.length > 0) {
      tips.push({
        type: "celebration",
        icon: CheckCircle,
        title: "Great Progress!",
        content: `You're doing amazing with ${successfulHabits.length} habit(s)! Consider gradually increasing the difficulty or adding complementary habits.`,
        color: "text-green-600",
        habits: successfulHabits.map((h) => h.name),
      })
    }

    // Tips for consistency
    if (inconsistentHabits.length > 0) {
      tips.push({
        type: "consistency",
        icon: TrendingUp,
        title: "Build Consistency",
        content: "Focus on showing up daily, even if it's just for 2 minutes. Consistency beats intensity.",
        color: "text-purple-600",
      })
    }

    // Motivational tips based on streaks
    const longestStreak = Math.max(...habits.map((h) => h.streak), 0)
    if (longestStreak >= 7) {
      tips.push({
        type: "motivation",
        icon: Heart,
        title: "Streak Master!",
        content: `Your longest streak is ${longestStreak} days! You're proving that consistency creates lasting change.`,
        color: "text-pink-600",
      })
    }

    return tips
  }

  const getGeneralTips = () => [
    {
      category: "Habit Formation",
      tips: [
        "Start with habits that take less than 2 minutes to complete",
        "Use the 'two-day rule' - never miss twice in a row",
        "Focus on identity: 'I am someone who exercises' vs 'I want to exercise'",
        "Make your environment work for you - remove friction for good habits",
      ],
    },
    {
      category: "Motivation & Mindset",
      tips: [
        "Celebrate small wins - they compound into big results",
        "Progress isn't always linear - expect ups and downs",
        "Focus on systems, not goals - good systems lead to good outcomes",
        "Be patient with yourself - lasting change takes time",
      ],
    },
    {
      category: "Tracking & Accountability",
      tips: [
        "Track your habits immediately after completing them",
        "Use visual cues like calendars or apps to stay motivated",
        "Share your goals with friends or family for accountability",
        "Review your progress weekly and adjust as needed",
      ],
    },
    {
      category: "Breaking Bad Habits",
      tips: [
        "Identify the cue, routine, and reward of your bad habit",
        "Replace the routine while keeping the same cue and reward",
        "Make bad habits harder to do and good habits easier",
        "Find healthier ways to meet the underlying need",
      ],
    },
  ]

  const personalizedTips = generatePersonalizedTips()
  const generalTips = getGeneralTips()

  return (
    <div className="space-y-6">
      {/* Personalized Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Personalized Tips
          </CardTitle>
          <CardDescription>Based on your current habits and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {personalizedTips.map((tip, index) => {
              const Icon = tip.icon
              return (
                <div key={index} className="flex gap-3 p-4 rounded-lg bg-gray-50">
                  <Icon className={`h-5 w-5 mt-0.5 ${tip.color}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{tip.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{tip.content}</p>
                    {tip.habits && (
                      <div className="flex gap-1 flex-wrap">
                        {tip.habits.map((habitName) => (
                          <Badge key={habitName} variant="outline" className="text-xs">
                            {habitName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* General Tips (only show in detailed view) */}
      {detailed && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">General Habit Tips</h3>
          {generalTips.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Encouragement based on progress */}
      {habits.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Keep Going!</h4>
                <p className="text-sm text-green-700">
                  You're building {habits.length} habit{habits.length !== 1 ? "s" : ""} and making real progress. Every
                  day you show up, you're becoming the person you want to be.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
