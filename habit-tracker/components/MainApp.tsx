"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { generatePersonalizedTips } from "../lib/ai-tips"
import HabitList from "./HabitList"
import DailyCheckin from "./DailyCheckin"
import AITips from "./AITips"
import AddHabitModal from "./AddHabitModal"

interface MainAppProps {
  session: Session
}

export default function MainApp({ session }: MainAppProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [habits, setHabits] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadData()
    generateDailyTips()
  }, [])

  const loadData = async () => {
    try {
      // Load user profile
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

      setProfile(profileData)

      // Load habits with progress
      const { data: habitsData } = await supabase
        .from("habits")
        .select(`
          *,
          habit_progress (*)
        `)
        .eq("user_id", session.user.id)

      setHabits(habitsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateDailyTips = async () => {
    try {
      await generatePersonalizedTips(session.user.id)
    } catch (error) {
      console.error("Error generating tips:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    await generateDailyTips()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {profile?.full_name || "User"}!</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{habits.length}</Text>
          <Text style={styles.statLabel}>Total Habits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{habits.filter((h) => h.streak > 0).length}</Text>
          <Text style={styles.statLabel}>Active Streaks</Text>
        </View>
      </View>

      <AITips userId={session.user.id} />

      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>+ Add New Habit</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview()
      case "habits":
        return <HabitList habits={habits} userId={session.user.id} onUpdate={loadData} />
      case "checkin":
        return <DailyCheckin habits={habits} userId={session.user.id} onUpdate={loadData} />
      default:
        return renderOverview()
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderContent()}

      <View style={styles.tabBar}>
        {[
          { id: "overview", label: "Overview" },
          { id: "habits", label: "Habits" },
          { id: "checkin", label: "Check-in" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AddHabitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={session.user.id}
        onAdd={loadData}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: "#ef4444",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#eff6ff",
  },
  tabText: {
    fontSize: 14,
    color: "#6b7280",
  },
  activeTabText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
})
