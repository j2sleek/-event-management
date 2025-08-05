"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { supabase } from "../lib/supabase"

interface AITipsProps {
  userId: string
}

export default function AITips({ userId }: AITipsProps) {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTips()
  }, [])

  const loadTips = async () => {
    try {
      const { data } = await supabase
        .from("ai_tips")
        .select("*")
        .eq("user_id", userId)
        .eq("is_read", false)
        .order("generated_at", { ascending: false })
        .limit(3)

      setTips(data || [])
    } catch (error) {
      console.error("Error loading tips:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (tipId: string) => {
    try {
      await supabase.from("ai_tips").update({ is_read: true }).eq("id", tipId)

      setTips(tips.filter((tip) => tip.id !== tipId))
    } catch (error) {
      console.error("Error marking tip as read:", error)
    }
  }

  if (loading || tips.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Personalized Tips</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tips.map((tip) => (
          <View key={tip.id} style={styles.tipCard}>
            <Text style={styles.tipType}>{tip.tip_type.toUpperCase()}</Text>
            <Text style={styles.tipContent}>{tip.tip_content}</Text>
            <TouchableOpacity style={styles.dismissButton} onPress={() => markAsRead(tip.id)}>
              <Text style={styles.dismissText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  tipCard: {
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 280,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  tipType: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 8,
  },
  tipContent: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
    marginBottom: 12,
  },
  dismissButton: {
    alignSelf: "flex-end",
  },
  dismissText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "600",
  },
})
