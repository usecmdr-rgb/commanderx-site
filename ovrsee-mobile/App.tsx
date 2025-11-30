import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { useColors } from "./src/hooks/useColors";
import { getSession, onAuthStateChange } from "./src/lib/auth";

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || "Unknown error"}
          </Text>
          <Text style={styles.errorHint}>
            Check the browser console (F12) for details
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// Inner app component that uses theme
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // Check initial auth state
    checkAuthState();

    // Listen for auth state changes
    try {
      const { data } = onAuthStateChange((event, session) => {
        if (mounted) {
          const authenticated = !!session;
          setIsAuthenticated(authenticated);
          setIsCheckingAuth(false);
        }
      });
      subscription = data.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      if (mounted) {
        setIsCheckingAuth(false);
        setIsAuthenticated(false);
      }
    }

    // Timeout fallback - always show login after 3 seconds if still checking
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth check timeout - showing login screen");
        setIsCheckingAuth(false);
        setIsAuthenticated(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const { session, error } = await getSession();

      if (error) {
        console.error("Error getting session:", error);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!session);
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
      // On error, default to showing login screen
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const colors = useColors();
  const { isDark } = useTheme();

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider
          style={Platform.select({
            web: { minHeight: "100vh" as any, backgroundColor: colors.background.background0 },
          })}
        >
          <StatusBar style={isDark ? "light" : "dark"} />
          <View style={[styles.loadingContainer, { backgroundColor: colors.background.background0 }]}>
            <ActivityIndicator size="large" color={colors.brand.accent} />
          </View>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider
        style={Platform.select({
          web: { minHeight: "100vh", backgroundColor: colors.background.background0 },
        })}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        {isAuthenticated ? <AppNavigator /> : <LoginScreen />}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

// Main App component with ThemeProvider wrapper
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// Styles will be created dynamically based on theme
// Note: ErrorBoundary uses static styles, so it will use default dark theme
// For dynamic styles, we'll need to update ErrorBoundary to accept theme as prop
const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.background0,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
    textAlign: "center",
  },
  errorHint: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

const styles = getStyles({ background: { background0: "#000000" }, text: { primary: "#F1F5F9", secondary: "#94A3B8", tertiary: "#64748B" } } as any);
