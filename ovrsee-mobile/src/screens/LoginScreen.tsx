import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { colors, theme } from "@/theme";
import { signInWithPassword, signUp } from "@/lib/auth";
import { testSupabaseConnection } from "@/lib/testConnection";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Supabase is configured
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const isSupabaseConfigured = supabaseUrl && 
                                 process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
                                 !supabaseUrl.includes('placeholder');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, test Supabase connection
      console.log('[Login] Testing Supabase connection...');
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        console.error('[Login] Supabase connection test failed:', connectionTest);
        setError(`Connection issue: ${connectionTest.error}. Please ensure your Supabase configuration is correct.`);
        setLoading(false);
        return;
      }
      console.log('[Login] Supabase connection OK');

      if (isLogin) {
        // Sign in
        console.log('[Login] Attempting to sign in with email:', email.trim());
        const { data: signInData, error: signInError } = await signInWithPassword(email.trim(), password);
        
        // Log full error details for debugging
        if (signInError) {
          console.error('[Login] Sign in error:', {
            message: signInError.message,
            status: signInError.status,
            name: signInError.name,
            error: signInError
          });
        } else {
          console.log('[Login] Sign in successful:', signInData);
        }
        
        if (signInError) {
          // Show the actual error message to help debug
          const errorMsg = signInError.message || "";
          const errorStatus = signInError.status;
          
          // Check for specific error types
          if (errorStatus === 400 || errorMsg.toLowerCase().includes("invalid login credentials")) {
            setError(
              `Invalid email or password (Error ${errorStatus}).\n\n` +
              `The account "${email.trim()}" may not exist in Supabase.\n\n` +
              `Please check:\n` +
              `1. Does the account exist in Supabase Dashboard?\n` +
              `2. Is the password correct? (TestBasic123!)\n` +
              `3. Is email verified? Check browser console (F12) for details.`
            );
          } else if (errorMsg.includes("Email not confirmed") || errorMsg.includes("email not confirmed")) {
            setError("Please verify your email address before signing in. Check your inbox for the verification email.");
          } else if (errorMsg.includes("fetch") || errorMsg.includes("network") || errorMsg.includes("Failed to fetch")) {
            setError(`Connection error: ${errorMsg}. Please check your internet connection.`);
          } else {
            // Show full error message for debugging
            setError(errorMsg || `Sign in failed (${errorStatus || 'unknown error'}). Please try again.`);
          }
          setLoading(false);
          return;
        }

        // Success - navigation will be handled by auth gate
      } else {
        // Sign up
        const { error: signUpError } = await signUp(email.trim(), password);
        
        if (signUpError) {
          const errorMsg = signUpError.message || "";
          if (errorMsg.includes("fetch") || errorMsg.includes("network") || errorMsg.includes("Failed to fetch")) {
            setError("Unable to connect to authentication service. Please check your internet connection.");
          } else {
            setError(errorMsg || "Failed to create account. Please try again.");
          }
          setLoading(false);
          return;
        }

        Alert.alert(
          "Account Created",
          "Please check your email to verify your account before signing in.",
          [{ text: "OK", onPress: () => setIsLogin(true) }]
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
        setError("Unable to connect to authentication service. Please check your internet connection and ensure Supabase environment variables are configured.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>OVRSEE</Text>
          </View>

            {/* Title */}
            <Text style={styles.title}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Sign in to continue to OVRSEE"
                : "Sign up to get started with OVRSEE"}
            </Text>

            {/* Configuration Warning */}
            {!isSupabaseConfigured && (
              <View style={[styles.errorContainer, { backgroundColor: colors.status.warning + "20" }]}>
                <Ionicons name="warning-outline" size={20} color={colors.status.warning} />
                <Text style={[styles.errorText, { color: colors.status.warning }]}>
                  Supabase not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
                </Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.status.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.text.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.text.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.text.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.text.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={isLogin ? "password" : "newPassword"}
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.textPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? "Sign In" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Login/Signup */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                disabled={loading}
              >
                <Text style={styles.toggleLink}>
                  {isLogin ? "Sign Up" : "Sign In"}
                </Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logoText: {
    fontSize: theme.typography.fontSize["3xl"],
    fontWeight: "700",
    color: colors.brand.primaryBlue,
  },
  title: {
    fontSize: theme.typography.fontSize["3xl"],
    fontWeight: "700",
    color: colors.text.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: colors.status.error + "20",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: colors.status.error,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.background1,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textPrimary,
    paddingVertical: 0,
  },
  submitButton: {
    backgroundColor: colors.brand.primaryBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.textPrimary,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  toggleText: {
    fontSize: theme.typography.fontSize.base,
    color: colors.text.textSecondary,
  },
  toggleLink: {
    fontSize: theme.typography.fontSize.base,
    color: colors.brand.primaryBlue,
    fontWeight: "600",
  },
});

