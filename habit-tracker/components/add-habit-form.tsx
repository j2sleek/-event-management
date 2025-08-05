"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

type AddHabitFormProps = {
  onAddHabit: (formData: {
    name: string
    description: string
    type: "start" | "stop"
    category: string
    difficulty: string
  }) => void
  onClose: () => void
}

export default function AddHabitForm({ onAddHabit, onClose }: AddHabitFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    category: "",
    // frequency: "daily",
    difficulty: "medium",
  })

  const [previewActionItems, setPreviewActionItems] = useState<string[]>([])

  const categories = [
    "Health & Fitness",
    "Productivity",
    "Learning",
    "Relationships",
    "Finance",
    "Mindfulness",
    "Creativity",
    "Other",
  ]

  type HabitType = "start" | "stop";

  const generatePreviewActionItems = (name: string, type: HabitType): string[] => {
    if (!name || !type) return []

    const actionTemplates: Record<HabitType, string[]> = {
      start: [
        `Set a specific time each day for ${name.toLowerCase()}`,
        `Create a reminder or alarm for ${name.toLowerCase()}`,
        `Prepare necessary materials or environment`,
        `Start with just 5-10 minutes daily`,
        `Track your progress in a visible place`,
      ],
      stop: [
        `Identify triggers that lead to ${name.toLowerCase()}`,
        `Replace the habit with a positive alternative`,
        `Remove temptations from your environment`,
        `Find an accountability partner`,
        `Reward yourself for each day without the habit`,
      ],
    }

    return actionTemplates[type] || []
  }

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    if (field === "name" || field === "type") {
      setPreviewActionItems(generatePreviewActionItems(newFormData.name, newFormData.type as HabitType))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (formData.name && formData.type) {
      onAddHabit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
      <Card className="w-full md:max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto rounded-t-xl md:rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <div>
            <CardTitle>Add New Habit</CardTitle>
            <CardDescription>Create a new habit to track and build consistency</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Habit Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Exercise, Read books, Stop smoking"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Habit Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select habit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Start a new habit</SelectItem>
                  <SelectItem value="stop">Stop a bad habit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your habit and why it's important to you..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleInputChange("difficulty", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {previewActionItems.length > 0 && (
              <div className="space-y-2">
                <Label>Generated Action Items</Label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    These action items will help you {formData.type === "start" ? "build" : "break"} this habit:
                  </p>
                  {previewActionItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5 text-xs">
                        {index + 1}
                      </Badge>
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-12" disabled={!formData.name || !formData.type}>
                Add Habit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
