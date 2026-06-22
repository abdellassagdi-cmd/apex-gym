import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { User } from "@supabase/supabase-js";

import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import { storage } from "../../utils/storage";

WebBrowser.maybeCompleteAuthSession();

type AuthContext = {
  email: string | null;
  isAuthenticated: boolean;
  isCloudEnabled: boolean;
  onRequestAuth: () => void;
  onSignOut: () => Promise<void>;
  userId: string;
};

type AuthGateProps = {
  children: (context: AuthContext) => ReactNode;
};

type SignupPlan = "free" | "plus" | "pro";
type SignupPlanOption = { id: SignupPlan; name: string; price: string; summary: string };

const pendingSignupPlanKey = "apex-gym:pending-signup-plan";
const validSignupPlans = new Set<SignupPlan>(["free", "plus", "pro"]);
const fallbackSignupPlans: SignupPlanOption[] = [
  { id: "free", name: "Free", price: "0 MAD", summary: "All exercises · GIF guides · Ads" },
  { id: "plus", name: "Plus", price: "49 MAD", summary: "Exercise videos · No ads" },
  { id: "pro", name: "Pro", price: "149 MAD", summary: "Videos · No ads · Personal coach" },
];

const redirectTo =
  process.env.EXPO_OS === "web"
    ? `${typeof window === "undefined" ? "http://localhost:8081" : window.location.origin}/auth/callback`
    : "apexgym://auth/callback";

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setAuthVisible(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const pendingPlan = storage.get<SignupPlan | null>(pendingSignupPlanKey, null);
    if (!pendingPlan || !validSignupPlans.has(pendingPlan)) return;

    let cancelled = false;
    setApplyingPlan(true);
    void activateTestPlan(user.id, pendingPlan)
      .then(() => storage.remove(pendingSignupPlanKey))
      .catch((error) => console.warn("Could not activate selected signup plan", error instanceof Error ? error.message : error))
      .finally(() => { if (!cancelled) setApplyingPlan(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const authContext = useMemo<AuthContext>(
    () => ({
      email: user?.email ?? null,
      isAuthenticated: Boolean(user),
      isCloudEnabled: Boolean(supabase && user),
      onRequestAuth: () => setAuthVisible(true),
      onSignOut: async () => {
        await supabase?.auth.signOut();
      },
      userId: user?.id ?? "local-device",
    }),
    [user],
  );

  if (loading || applyingPlan) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F8FC]">
        <ActivityIndicator color={colors.accent} />
        <Text className="mt-3 text-sm font-black text-bone">{applyingPlan ? "Activating your plan" : "Loading account"}</Text>
      </View>
    );
  }

  if (!supabase) {
    return children(authContext);
  }

  if (!user && authVisible) {
    return <AuthScreen onClose={() => setAuthVisible(false)} />;
  }

  return children(authContext);
}

function AuthScreen({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SignupPlan>("free");
  const [availablePlans, setAvailablePlans] = useState<SignupPlanOption[]>(fallbackSignupPlans);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void supabase
      .from("plans")
      .select("code,name,monthly_price,currency,entitlements")
      .eq("active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (cancelled || error || !data?.length) return;
        const plans = data
          .filter((plan) => validSignupPlans.has(plan.code as SignupPlan))
          .map((plan): SignupPlanOption => ({
            id: plan.code as SignupPlan,
            name: plan.name,
            price: `${Number(plan.monthly_price)} ${plan.currency}`,
            summary: planSummary(plan.code as SignupPlan),
          }));
        if (plans.length === 3) setAvailablePlans(plans);
      });
    return () => { cancelled = true; };
  }, []);

  async function submitEmail() {
    if (!supabase || busy) {
      return;
    }

    setBusy(true);
    setStatus("");

    if (mode === "signUp") storage.set(pendingSignupPlanKey, selectedPlan);
    const action =
      mode === "signIn"
        ? supabase.auth.signInWithPassword({ email: email.trim(), password })
        : supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: redirectTo },
          });
    const { error } = await action;

    if (error) {
      if (mode === "signUp") storage.remove(pendingSignupPlanKey);
      setStatus(formatAuthError(error.message));
    } else if (mode === "signUp") {
      setStatus("Account created. Check your email if confirmation is enabled.");
    }

    setBusy(false);
  }

  async function signInWithGoogle() {
    if (!supabase || busy) {
      return;
    }

    setBusy(true);
    setStatus("");

    if (mode === "signUp") storage.set(pendingSignupPlanKey, selectedPlan);

    if (process.env.EXPO_OS === "web") {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        if (mode === "signUp") storage.remove(pendingSignupPlanKey);
        setStatus(formatAuthError(error.message));
        setBusy(false);
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      if (mode === "signUp") storage.remove(pendingSignupPlanKey);
      setStatus(formatAuthError(error?.message ?? "Could not start Google sign-in."));
      setBusy(false);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === "success") {
      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        setStatus(exchangeError ? formatAuthError(exchangeError.message) : "");
      } else {
        const callbackHash = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
        const accessToken = callbackHash.get("access_token");
        const refreshToken = callbackHash.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          setStatus(sessionError ? formatAuthError(sessionError.message) : "");
        } else {
          if (mode === "signUp") storage.remove(pendingSignupPlanKey);
          setStatus("Google did not return a valid session. Check the Supabase redirect URL settings.");
        }
      }
    } else if (mode === "signUp") {
      storage.remove(pendingSignupPlanKey);
    }

    setBusy(false);
  }

  const canSubmit = email.trim().includes("@") && password.length >= 6 && !busy;

  return (
    <ScrollView
      className="flex-1 bg-[#F7F8FC]"
      contentContainerClassName="flex-grow justify-center gap-5 px-6 py-10"
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityLabel="Close login"
        accessibilityRole="button"
        className="h-11 self-start justify-center rounded-full border border-line bg-white px-5"
        onPress={onClose}
      >
        <Text className="text-xs font-black uppercase text-bone">Back</Text>
      </Pressable>
      <View className="items-center">
        <Image
          resizeMode="contain"
          source={require("../../../assets/brand-logo.png")}
          style={{ borderRadius: 22, height: 76, maxHeight: 76, maxWidth: 76, width: 76 }}
        />
        <Text className="mt-5 text-center text-4xl font-black text-bone">Apex Gym</Text>
        <Text className="mt-2 text-center text-sm font-semibold leading-5 text-ash">
          Create your account to keep workouts, settings, and progress private.
        </Text>
      </View>

      <View
        className="gap-3 rounded-[28px] border border-line bg-white p-4"
        style={{ boxShadow: "0 18px 42px rgba(17, 19, 24, 0.08)" }}
      >
        <View className="flex-row rounded-[18px] bg-carbon p-1">
          {[
            { id: "signIn" as const, label: "Log in" },
            { id: "signUp" as const, label: "Sign up" },
          ].map((item) => {
            const selected = mode === item.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`h-11 flex-1 items-center justify-center rounded-[15px] ${
                  selected ? "bg-electric" : ""
                }`}
                key={item.id}
                onPress={() => setMode(item.id)}
              >
                <Text className={`text-sm font-black ${selected ? "text-white" : "text-steel"}`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === "signUp" ? (
          <View className="gap-2 py-1">
            <View className="flex-row items-end justify-between px-1">
              <Text className="text-xs font-black uppercase text-ash">Choose your plan</Text>
              <Text className="text-[10px] font-black uppercase text-electric">Test access · No payment</Text>
            </View>
            {availablePlans.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <Pressable
                  accessibilityLabel={`${plan.name} plan`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  className={`rounded-[20px] border p-3 ${selected ? "border-electric bg-electric/10" : "border-line bg-carbon"}`}
                  key={plan.id}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-black text-bone">{plan.name}</Text>
                      <Text className="mt-1 text-xs font-semibold text-ash">{plan.summary}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-black text-electric">{plan.price}</Text>
                      <Text className="mt-1 text-[9px] font-black uppercase text-ash">testing</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <AuthInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          value={email}
        />
        <AuthInput
          label="Password"
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />

        {status ? (
          <View className="rounded-[18px] bg-electric/10 p-3">
            <Text className="text-sm font-semibold leading-5 text-bone">{status}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className={`h-14 items-center justify-center rounded-[20px] bg-electric ${
            canSubmit ? "" : "opacity-35"
          }`}
          disabled={!canSubmit}
          onPress={submitEmail}
        >
          <Text className="text-sm font-black uppercase text-white">
            {busy ? "Please wait" : mode === "signIn" ? "Log in" : "Create account"}
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-3 py-1">
          <View className="h-px flex-1 bg-line" />
          <Text className="text-[10px] font-black uppercase text-ash">or continue with</Text>
          <View className="h-px flex-1 bg-line" />
        </View>

        <Pressable
          accessibilityLabel={mode === "signIn" ? "Log in with Google" : "Sign up with Google"}
          accessibilityRole="button"
          className={`h-14 flex-row items-center justify-center gap-3 rounded-[20px] border border-line bg-white ${
            busy ? "opacity-35" : ""
          }`}
          disabled={busy}
          onPress={signInWithGoogle}
        >
          <View className="h-7 w-7 items-center justify-center rounded-full bg-carbon">
            <Text className="text-base font-black text-electric">G</Text>
          </View>
          <Text className="text-sm font-black text-bone">
            {mode === "signIn" ? "Log in with Google" : "Sign up with Google"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

async function activateTestPlan(userId: string, plan: SignupPlan) {
  if (!supabase) return;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan_code: plan,
        provider: "manual",
        status: "active",
        current_period_end: null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("plan_code")
      .maybeSingle();
    if (!error && data?.plan_code === plan) return;
    lastError = new Error(error?.message ?? "Subscription row is not ready yet.");
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
  }
  throw lastError ?? new Error("Could not activate the selected plan.");
}

function planSummary(plan: SignupPlan) {
  if (plan === "free") return "All exercises · GIF guides · Ads";
  if (plan === "plus") return "Exercise videos · No ads";
  return "Videos · No ads · Personal coach";
}

function formatAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email rate limit")) {
    return "Supabase blocked confirmation emails for a short time. Try Log in if the account already exists, or wait a few minutes.";
  }

  if (normalized.includes("provider is not enabled")) {
    return "Google sign-in is not enabled in Supabase yet. Use email login for now.";
  }

  return message;
}

function AuthInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none";
}) {
  return (
    <View>
      <Text className="mb-2 text-xs font-black uppercase text-ash">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        className="h-14 rounded-[18px] border border-line bg-carbon px-4 text-base font-black text-bone"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        value={value}
      />
    </View>
  );
}
