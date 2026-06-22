import "./global.css";

import { StatusBar } from "expo-status-bar";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthGate } from "./src/features/auth/AuthGate";
import { OnboardingFlow } from "./src/features/onboarding/screens/OnboardingFlow";
import { WorkoutPlannerScreen } from "./src/features/workouts/screens/WorkoutPlannerScreen";
import { storage } from "./src/utils/storage";

type ErrorBoundaryState = {
  message: string | null;
};

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.message) {
      return (
        <View className="flex-1 items-center justify-center bg-obsidian px-6">
          <Text className="text-center text-lg font-black text-bone">Render failed</Text>
          <Text className="mt-3 text-center text-sm text-danger">{this.state.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const locationSearch =
    (globalThis as typeof globalThis & { location?: { search?: string } }).location?.search ?? "";
  const forceOnboarding = locationSearch.includes("onboarding=1");
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(() =>
    forceOnboarding
      ? false
      : locationSearch.includes("app=1")
      ? true
      : storage.get("apex-gym:onboarding-complete", false),
  );

  useEffect(() => {
    if (forceOnboarding) return;
    storage.set("apex-gym:onboarding-complete", isOnboardingComplete);
  }, [forceOnboarding, isOnboardingComplete]);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {isOnboardingComplete ? (
          <AuthGate>
            {({ email, isCloudEnabled, onSignOut, userId }) => (
              <WorkoutPlannerScreen
                accountEmail={email}
                isCloudEnabled={isCloudEnabled}
                onSignOut={onSignOut}
                storageScope={userId}
              />
            )}
          </AuthGate>
        ) : (
          <OnboardingFlow onComplete={() => setIsOnboardingComplete(true)} />
        )}
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
