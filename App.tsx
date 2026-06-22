import "./global.css";

import { StatusBar } from "expo-status-bar";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";
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
  const [guestStarted, setGuestStarted] = useState(false);

  useEffect(() => {
    if (forceOnboarding) return;
    storage.set("apex-gym:onboarding-complete", isOnboardingComplete);
  }, [forceOnboarding, isOnboardingComplete]);

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate>
          {({ email, isAuthenticated, isCloudEnabled, onRequestAuth, onSignOut, userId }) =>
            isOnboardingComplete ? (
              <WorkoutPlannerScreen
                accountEmail={email}
                isAuthenticated={isAuthenticated}
                isCloudEnabled={isCloudEnabled}
                onRequestAuth={onRequestAuth}
                onSignOut={onSignOut}
                storageScope={userId}
              />
            ) : guestStarted || isAuthenticated ? (
              <OnboardingFlow onComplete={() => setIsOnboardingComplete(true)} />
            ) : (
              <EntryChoice onLogin={onRequestAuth} onSkip={() => setGuestStarted(true)} />
            )
          }
        </AuthGate>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

function EntryChoice({ onLogin, onSkip }: { onLogin: () => void; onSkip: () => void }) {
  return (
    <View className="flex-1 justify-between bg-[#F7F8FC] px-6 pb-10 pt-16">
      <View className="items-center">
        <Image
          accessibilityLabel="Apex Gym"
          resizeMode="contain"
          source={require("./assets/brand-logo.png")}
          style={{ borderRadius: 28, height: 112, width: 112 }}
        />
        <Text className="mt-8 text-center text-5xl font-black text-bone">Apex Gym</Text>
        <Text className="mt-4 text-center text-base font-semibold leading-6 text-ash">
          Start free without an account, or log in to sync your workouts and subscription.
        </Text>
      </View>
      <View className="gap-3">
        <Pressable
          accessibilityLabel="Log in or create account"
          accessibilityRole="button"
          className="h-16 items-center justify-center rounded-full bg-electric"
          onPress={onLogin}
        >
          <Text className="text-base font-black uppercase text-white">Log in / Create account</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Continue as guest"
          accessibilityRole="button"
          className="h-16 items-center justify-center rounded-full border border-line bg-white"
          onPress={onSkip}
        >
          <Text className="text-base font-black uppercase text-bone">Continue as guest</Text>
        </Pressable>
        <Text className="text-center text-xs font-semibold leading-5 text-ash">
          Guest access uses the Free plan and includes ads. You can create an account later from Profile.
        </Text>
      </View>
    </View>
  );
}
