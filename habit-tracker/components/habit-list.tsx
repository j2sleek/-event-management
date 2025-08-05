"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Target, Calendar, TrendingUp, Trash2, CheckCircle } from "lucide-react"

type ActionItem = {
  text: string
  completed?: boolean
} | string

type Habit = {
  id: string | number
  name: string
  type: "start" | "stop"
  category?: string | null
  description?: string | null
  streak: number
  progress: any[]
  completionRate: number
  actionItems: ActionItem[]
}

type HabitListProps = {
  habits: Habit[]
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>
}

export default function HabitList({ habits, setHabits }: HabitListProps) {
  const [expandedHabits, setExpandedHabits] = useState<Set<string | number>>(new Set())

  const toggleExpanded = (habitId: string | number) => {
    const newExpanded = new Set(expandedHabits)
    if (newExpanded.has(habitId)) {
      newExpanded.delete(habitId)
    } else {
      newExpanded.add(habitId)
    }
    setExpandedHabits(newExpanded)
  }

  const deleteHabit = (habitId: string | number) => {
    setHabits(habits.filter((habit: Habit) => habit.id !== habitId))
  }

  const markActionItemComplete = (habitId: string | number, actionIndex: number) => {
    setHabits(
      habits.map((habit: Habit) => {
        if (habit.id === habitId) {
          const newActionItems = [...habit.actionItems]
          if (typeof newActionItems[actionIndex] === "object" && newActionItems[actionIndex] !== null) {
            newActionItems[actionIndex] = {
              ...(newActionItems[actionIndex] as { text: string; completed?: boolean }),
              completed: true,
            }
          }
          return { ...habit, actionItems: newActionItems }
        }
        return habit
      })
    )
  }

  if (habits.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No habits yet</h3>
          <p className="text-gray-600 mb-4">Start building better habits by adding your first one!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <Card key={habit.id} className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <CardTitle className="text-lg truncate">{habit.name}</CardTitle>
                  <Badge variant={habit.type === "start" ? "default" : "destructive"} className="text-xs">
                    {habit.type === "start" ? "Start" : "Stop"}
                  </Badge>
                  {habit.category && (
                    <Badge variant="outline" className="text-xs">
                      {habit.category}
                    </Badge>
                  )}
                </div>
                {habit.description && (
                  <CardDescription className="text-sm line-clamp-2">{habit.description}</CardDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteHabit(habit.id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
                <span className="text-xs font-medium block">{habit.streak}</span>
                <span className="text-xs text-gray-500">days</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <span className="text-xs font-medium block">{habit.progress.length}</span>
                <span className="text-xs text-gray-500">tracked</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Target className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                <span className="text-xs font-medium block">{habit.completionRate}%</span>
                <span className="text-xs text-gray-500">success</span>
              </div>
            </div>

            <div className="mb-4">
              <div>
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600 ml-2">{habit.completionRate}%</span>
              </div>
              <Progress value={habit.completionRate} className="h-2" />
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto"
                  onClick={() => toggleExpanded(habit.id)}
                >
                  <span className="font-medium">Action Items ({habit.actionItems.length})</span>
                  {expandedHabits.has(habit.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-2">
                  {habit.actionItems.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        typeof item === "object" && item.completed
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mt-0.5"
                        onClick={() => markActionItemComplete(habit.id, index)}
                      >
                        <CheckCircle
                          className={`h-4 w-4 ${
                            typeof item === "object" && item.completed ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                      </Button>
                      <div className="flex-1">
                        <p
                          className={`text-sm ${
                            typeof item === "object" && item.completed ? "line-through text-gray-600" : "text-gray-900"
                          }`}
                        >
                          {typeof item === "string" ? item : item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
