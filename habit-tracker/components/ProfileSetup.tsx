"use client"

import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { Picker } from "@react-native-picker/picker"
import { supabase } from "../lib/supabase"
import { getCurrentLocation } from "../lib/location"

interface ProfileSetupProps {
  userId: string
  onComplete: () => void
}

export default function ProfileSetup({ userId, onComplete }: ProfileSetupProps) {
  const [profile, setProfile] = useState({
    full_name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    activity_level: "",
    sleep_hours: "",
    stress_level: "5",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getLocationData()
  }, [])

  const getLocationData = async () => {
    const location = await getCurrentLocation()
    if (location) {
      // Update user location in profile
      await supabase.from("profiles").upsert({
        id: userId,
        location: `${location.city}, ${location.country}`,
        timezone: location.timezone,
      })
    }
  }

  const handleSave = async () => {
    if (!profile.full_name || !profile.age || !profile.gender || !profile.activity_level) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: profile.full_name,
        age: Number.parseInt(profile.age),
        gender: profile.gender,
        height: profile.height ? Number.parseFloat(profile.height) : null,
        weight: profile.weight ? Number.parseFloat(profile.weight) : null,
        activity_level: profile.activity_level,
        sleep_hours: profile.sleep_hours ? Number.parseFloat(profile.sleep_hours) : null,
        stress_level: Number.parseInt(profile.stress_level),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      onComplete()
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Help us personalize your experience</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={profile.full_name}
          onChangeText={(text) => setProfile({ ...profile, full_name: text })}
          placeholder="Enter your full name"
        />

        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          value={profile.age}
          onChangeText={(text) => setProfile({ ...profile, age: text })}
          placeholder="Enter your age"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Gender *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profile.gender}
            onValueChange={(value) => setProfile({ ...profile, gender: value })}
            style={styles.picker}
          >
            <Picker.Item label="Select gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
            <Picker.Item label="Prefer not to say" value="prefer_not_to_say" />
          </Picker>
        </View>

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={profile.height}
          onChangeText={(text) => setProfile({ ...profile, height: text })}
          placeholder="Enter your height"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={profile.weight}
          onChangeText={(text) => setProfile({ ...profile, weight: text })}
          placeholder="Enter your weight"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Activity Level *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profile.activity_level}
            onValueChange={(value) => setProfile({ ...profile, activity_level: value })}
            style={styles.picker}
          >
            <Picker.Item label="Select activity level" value="" />
            <Picker.Item label="Sedentary (little/no exercise)" value="sedentary" />
            <Picker.Item label="Lightly active (light exercise 1-3 days/week)" value="lightly_active" />
            <Picker.Item label="Moderately active (moderate exercise 3-5 days/week)" value="moderately_active" />
            <Picker.Item label="Very active (hard exercise 6-7 days/week)" value="very_active" />
            <Picker.Item label="Extremely active (very hard exercise, physical job)" value="extremely_active" />
          </Picker>
        </View>

        <Text style={styles.label}>Sleep Hours per Night</Text>
        <TextInput
          style={styles.input}
          value={profile.sleep_hours}
          onChangeText={(text) => setProfile({ ...profile, sleep_hours: text })}
          placeholder="Average hours of sleep"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Stress Level (1-10)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profile.stress_level}
            onValueChange={(value) => setProfile({ ...profile, stress_level: value })}
            style={styles.picker}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <Picker.Item key={num} label={num.toString()} value={num.toString()} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Saving..." : "Complete Setup"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "white",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "white",
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
