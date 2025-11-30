import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TextInput, TouchableOpacity } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function InsightsAskInsightsScreen() {
  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAsk = () => {
    if (query.trim()) {
      // Mock answer generation
      setAnswers([...answers, `Answer to: "${query}"`]);
      setQuery("");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Ask Insights" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Ask me anything about your business insights..."
            placeholderTextColor={colors.text.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.askButton, !query.trim() && styles.askButtonDisabled]}
            onPress={handleAsk}
            disabled={!query.trim()}
          >
            <Ionicons name="send" size={20} color={colors.text.textPrimary} />
            <Text style={styles.askButtonText}>Ask</Text>
          </TouchableOpacity>
        </Card>

        {answers.map((answer, index) => (
          <Card key={index} style={styles.answerCard}>
            <Text style={styles.answerText}>{answer}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.background0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  inputCard: {
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: colors.background.background1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 100,
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.md,
    textAlignVertical: "top",
  },
  askButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: colors.brand.primaryBlue,
    borderRadius: theme.borderRadius.md,
  },
  askButtonDisabled: {
    opacity: 0.5,
  },
  askButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
  answerCard: {
    marginBottom: theme.spacing.md,
  },
  answerText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textPrimary,
    lineHeight: 22,
  },
});

