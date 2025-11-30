import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { colors, theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

export default function StudioUploadMediaScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Upload Media" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.uploadCard}>
          <View style={styles.uploadArea}>
            <Ionicons name="cloud-upload-outline" size={48} color={colors.brand.primaryBlue} />
            <Text style={styles.uploadText}>Tap to upload media</Text>
            <Text style={styles.uploadHint}>Images, videos, or documents</Text>
          </View>
        </Card>
        <View style={styles.toolsContainer}>
          <Text style={styles.toolsTitle}>Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolButton}>
              <Ionicons name="camera-outline" size={24} color={colors.brand.primaryBlue} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton}>
              <Ionicons name="image-outline" size={24} color={colors.brand.primaryBlue} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton}>
              <Ionicons name="videocam-outline" size={24} color={colors.brand.primaryBlue} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton}>
              <Ionicons name="document-outline" size={24} color={colors.brand.primaryBlue} />
            </TouchableOpacity>
          </View>
        </View>
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
  uploadCard: {
    marginBottom: theme.spacing.lg,
  },
  uploadArea: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    minHeight: 200,
  },
  uploadText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginTop: theme.spacing.md,
  },
  uploadHint: {
    fontSize: theme.typography.fontSize.sm,
    color: colors.text.textMuted,
    marginTop: theme.spacing.xs,
  },
  toolsContainer: {
    marginTop: theme.spacing.md,
  },
  toolsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.textPrimary,
    marginBottom: theme.spacing.md,
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  toolButton: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.background.background2,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
});

