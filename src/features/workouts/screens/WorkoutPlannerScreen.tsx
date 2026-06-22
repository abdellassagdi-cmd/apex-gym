import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  AppState,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Heart,
  ListFilter,
  MoreVertical,
  Plus,
  Crown,
  MessageCircle,
  Send,
  Play,
  Search,
  Settings2,
  Trophy,
  X,
} from "lucide-react-native";

import { colors } from "../../../theme/colors";
import { AppDock, type AppDockTab } from "../components/AppDock";
import { ExerciseDetailSheet } from "../components/ExerciseDetailSheet";
import {
  NotificationCenter,
  ProgramBuilderSheet,
  ProfileEditorSheet,
  SettingsDetailSheet,
  WorkoutReminderSheet,
  type AthleteProfile,
  type SettingsPage,
  type SettingsPreferences,
  type WorkoutReminderSettings,
} from "../components/ManagementSheets";
import { ProgramDetailSheet } from "../components/ProgramDetailSheet";
import {
  WorkoutSessionOverlay,
  type CompletedWorkoutSession,
} from "../components/WorkoutSessionOverlay";
import { trainingPrograms, type TrainingProgram, type TrainingWeekday } from "../data/workoutCatalog";
import { exerciseLibrary } from "../data/exerciseLibrary";
import { todayWorkout } from "../data/todayWorkout";
import { loadExerciseCatalog } from "../services/exerciseDb";
import {
  loadCloudUserData,
  saveCloudProfile,
  saveCloudSession,
  saveCloudSettings,
} from "../services/userCloudData";
import { configureWorkoutNotifications, syncWorkoutReminders } from "../services/workoutReminders";
import { freeMembership, loadExerciseContent, loadMembership, loadProgramContent, sendMemberMessage, type MembershipState, type PlanCode } from "../services/membership";
import { syncOnboardingIntake } from "../services/member-intake";
import { emptySavedContent, loadSavedContent, saveSavedContent, type SavedContent } from "../services/saved-content";
import { buildAthleteProfile } from "../domain/recommendations";
import type { OnboardingProfile } from "../../onboarding/types";
import { purchaseRevenueCatPlan, restoreRevenueCatPurchases, syncRevenueCatIdentity } from "../../billing/revenuecat";
import type { Exercise, MuscleGroup } from "../types";
import { storage } from "../../../utils/storage";
import { supabase } from "../../../lib/supabase";

type LibraryFilter = "all" | MuscleGroup;

const libraryFilters: Array<{ id: LibraryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "quads", label: "Legs" },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms" },
];

const programTabs = ["Library", "My Programs", "Favorites"] as const;
const allEligibleLevels: Exercise["eligibleLevels"] = ["beginner", "intermediate", "advanced", "athlete"];

const weekBars = [38, 58, 46, 68, 84, 55, 43];
const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];
const heroImage =
  "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1100&q=90";
const benchImage =
  "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=900&q=86";
const profileKey = "apex-gym:athlete-profile";
const reminderKey = "apex-gym:workout-reminder-settings";
const settingsKey = "apex-gym:profile-settings";
const savedContentKey = "apex-gym:saved-content";

const defaultAthleteProfile: AthleteProfile = {
  name: "Apex Member",
  weight: 82.4,
  height: 178,
  fitnessLevel: "Intermediate",
  goal: "Strength gain",
  trainingDaysPerWeek: 3,
  preferredIntensity: "Challenging",
};

function initialAthleteProfile(scope: string): AthleteProfile {
  const scoped = storage.get<AthleteProfile | null>(`${profileKey}:${scope}`, null);
  if (scoped) return scoped;
  const onboarding = storage.get<OnboardingProfile | null>("apex-gym:onboarding-profile", null);
  return onboarding ? buildAthleteProfile(onboarding) : defaultAthleteProfile;
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  try { return JSON.stringify(error); } catch { return String(error); }
}

const defaultReminderSettings: WorkoutReminderSettings = {
  enabled: false,
  hour: 18,
  minute: 30,
  weekdays: [2, 4, 6],
};

const defaultSettingsPreferences: SettingsPreferences = {
  health: ["No current restrictions"],
  equipment: "Full commercial gym",
  privacy: ["Workout analytics", "Body metrics"],
};

type CloudExercise = {
  exercise_key: string; name: string; target_muscle: string; secondary_muscles?: string[];
  equipment: string; difficulty_levels?: Exercise["eligibleLevels"]; sets?: number; reps?: string;
  weight?: string; rest_seconds?: number; tempo?: string; intensity?: Exercise["intensity"];
  gif_url: string; video_url?: string | null; coach_cue?: string; instructions?: string[];
};

type CloudProgram = {
  program_key: string; title: string; subtitle: string; environment: TrainingProgram["environment"];
  difficulty_levels?: TrainingProgram["eligibleLevels"]; duration_weeks: number; sessions_per_week: number;
  target: string; image_url: string; exercise_keys?: string[];
  schedule?: Array<{ weekday: number; label: string; exercise_keys: string[] }>;
  featured?: boolean;
};

function mapContentExercise(content: CloudExercise, base?: Exercise): Exercise {
  return {
    id: content.exercise_key,
    exerciseDbId: base?.exerciseDbId ?? content.exercise_key,
    name: content.name,
    targetMuscle: content.target_muscle as MuscleGroup,
    secondaryMuscles: [...new Set(content.secondary_muscles ?? base?.secondaryMuscles ?? [])].filter((muscle) => muscle !== content.target_muscle) as MuscleGroup[],
    equipment: content.equipment,
    eligibleLevels: content.difficulty_levels?.length ? content.difficulty_levels : (base?.eligibleLevels ?? ["beginner", "intermediate", "advanced", "athlete"]),
    sets: content.sets ?? base?.sets ?? 3,
    reps: content.reps ?? base?.reps ?? "8-12",
    weight: content.weight ?? base?.weight ?? "Auto load",
    restSeconds: content.rest_seconds ?? base?.restSeconds ?? 75,
    tempo: content.tempo ?? base?.tempo ?? "2-1-2",
    intensity: content.intensity ?? base?.intensity ?? "hypertrophy",
    gifUrl: content.gif_url || base?.gifUrl || "",
    videoUrl: content.video_url ?? base?.videoUrl ?? null,
    coachCue: content.coach_cue || base?.coachCue || "Keep every repetition controlled and pain-free.",
    instructions: content.instructions?.length ? content.instructions : (base?.instructions ?? ["Use a controlled range of motion.", "Keep stable posture.", "Stop if technique changes."]),
  };
}

function mapContentProgram(content: CloudProgram, exercises: Map<string, Exercise>, base?: TrainingProgram): TrainingProgram {
  const exerciseKeys = content.exercise_keys ?? base?.exercises.map((exercise) => exercise.id) ?? [];
  const programExercises = exerciseKeys.map((key) => exercises.get(key)).filter((item): item is Exercise => Boolean(item));
  const schedule = content.schedule?.length ? content.schedule.map((day) => ({
    weekday: day.weekday as TrainingWeekday,
    label: day.label,
    exercises: day.exercise_keys.map((key) => exercises.get(key)).filter((item): item is Exercise => Boolean(item)),
  })) : (base?.schedule ?? []);
  const eligibleLevels = content.difficulty_levels?.length ? content.difficulty_levels : (base?.eligibleLevels ?? ["beginner", "intermediate", "advanced", "athlete"]);
  const primary = eligibleLevels[0] ?? "beginner";
  return {
    id: content.program_key,
    title: content.title,
    subtitle: content.subtitle,
    environment: content.environment,
    level: primary === "beginner" ? "Beginner" : primary === "intermediate" ? "Intermediate" : "Advanced",
    eligibleLevels,
    durationWeeks: content.duration_weeks,
    sessionsPerWeek: content.sessions_per_week,
    target: content.target,
    imageUrl: content.image_url,
    featured: content.featured,
    adminCurated: true,
    exercises: programExercises.length ? programExercises : (base?.exercises ?? []),
    schedule,
  };
}

type WorkoutPlannerScreenProps = {
  accountEmail?: string | null;
  isAuthenticated?: boolean;
  isCloudEnabled?: boolean;
  onChoosePlan?: (plan: PlanCode) => Promise<void>;
  onRequestAuth?: () => void;
  onSignOut?: () => Promise<void>;
  storageScope?: string;
};

export function WorkoutPlannerScreen({
  accountEmail = null,
  isAuthenticated = false,
  isCloudEnabled = false,
  onChoosePlan,
  onRequestAuth,
  onSignOut,
  storageScope = "local-device",
}: WorkoutPlannerScreenProps) {
  const [activeTab, setActiveTab] = useState<AppDockTab>("today");
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [activeProgram, setActiveProgram] = useState<TrainingProgram | null>(null);
  const [sessionExercises, setSessionExercises] = useState<Exercise[] | null>(null);
  const [sessionTitle, setSessionTitle] = useState(todayWorkout.title);
  const [exerciseCatalog, setExerciseCatalog] = useState<Exercise[]>(exerciseLibrary);
  const [programCatalog, setProgramCatalog] = useState<TrainingProgram[]>(trainingPrograms);
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<CompletedWorkoutSession[]>([]);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [progressCalendarVisible, setProgressCalendarVisible] = useState(false);
  const [profileEditorVisible, setProfileEditorVisible] = useState(false);
  const [programBuilderVisible, setProgramBuilderVisible] = useState(false);
  const [planOffersVisible, setPlanOffersVisible] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [settingsPage, setSettingsPage] = useState<SettingsPage | null>(null);
  const [membership, setMembership] = useState<MembershipState>(freeMembership);
  const [savedContent, setSavedContent] = useState<SavedContent>(() =>
    storage.get(`${savedContentKey}:${storageScope}`, emptySavedContent),
  );
  const [athleteProfile, setAthleteProfile] = useState(() => initialAthleteProfile(storageScope));
  const [reminderSettings, setReminderSettings] = useState(() =>
    storage.get<WorkoutReminderSettings>(`${reminderKey}:${storageScope}`, defaultReminderSettings),
  );
  const [settingsPreferences, setSettingsPreferences] = useState(() =>
    storage.get<SettingsPreferences>(`${settingsKey}:${storageScope}`, defaultSettingsPreferences),
  );

  useEffect(() => {
    let cancelled = false;
    let latestRequest = 0;

    async function hydrateCatalog() {
      const requestId = ++latestRequest;
      const [result, customContent, customPrograms] = await Promise.all([
        loadExerciseCatalog(),
        isCloudEnabled ? loadExerciseContent().catch(() => []) : Promise.resolve([]),
        isCloudEnabled ? loadProgramContent().catch(() => []) : Promise.resolve([]),
      ]);

      if (!cancelled && requestId === latestRequest) {
        const contentByKey = new Map(customContent.map((item) => [item.exercise_key, item]));
        const mergedExercises = result.exercises.map((exercise) => {
          const content = contentByKey.get(exercise.id);
          return content ? mapContentExercise(content, exercise) : exercise;
        });
        const knownKeys = new Set(mergedExercises.map((exercise) => exercise.id));
        setExerciseCatalog([...mergedExercises, ...customContent.filter((item) => !knownKeys.has(item.exercise_key)).map((item) => mapContentExercise(item))]);
        const exerciseByKey = new Map([...mergedExercises, ...exerciseLibrary].map((exercise) => [exercise.id, exercise]));
        const programByKey = new Map(customPrograms.map((program) => [program.program_key, program]));
        const mergedPrograms = trainingPrograms.map((program) => {
          const content = programByKey.get(program.id);
          return content ? mapContentProgram(content, exerciseByKey, program) : program;
        });
        const knownProgramKeys = new Set(mergedPrograms.map((program) => program.id));
        setProgramCatalog([...mergedPrograms, ...customPrograms.filter((program) => !knownProgramKeys.has(program.program_key)).map((program) => mapContentProgram(program, exerciseByKey))]);
      }
    }

    void hydrateCatalog();
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void hydrateCatalog();
    });
    const contentChannel = isCloudEnabled && supabase
      ? supabase
          .channel("published-workout-content")
          .on("postgres_changes", { event: "*", schema: "public", table: "exercise_content" }, () => void hydrateCatalog())
          .on("postgres_changes", { event: "*", schema: "public", table: "program_content" }, () => void hydrateCatalog())
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      appStateSubscription.remove();
      if (contentChannel && supabase) void supabase.removeChannel(contentChannel);
    };
  }, [catalogRefreshKey, isCloudEnabled]);

  useEffect(() => {
    if (!isCloudEnabled || storageScope === "local-device") {
      setMembership(freeMembership);
      return;
    }
    let cancelled = false;
    void loadMembership(storageScope).then((next) => { if (!cancelled) setMembership(next); })
      .catch((error) => console.warn("Could not load membership", error));
    return () => { cancelled = true; };
  }, [isCloudEnabled, storageScope]);

  useEffect(() => {
    const scoped = storage.get<SavedContent>(`${savedContentKey}:${storageScope}`, emptySavedContent);
    const guest = isCloudEnabled
      ? storage.get<SavedContent>(`${savedContentKey}:local-device`, emptySavedContent)
      : emptySavedContent;
    const local: SavedContent = {
      favoriteExerciseIds: Array.from(new Set([...guest.favoriteExerciseIds, ...scoped.favoriteExerciseIds])),
      favoriteProgramIds: Array.from(new Set([...guest.favoriteProgramIds, ...scoped.favoriteProgramIds])),
      myPrograms: Array.from(new Map([...guest.myPrograms, ...scoped.myPrograms].map((program) => [program.id, program])).values()),
      coachPrograms: scoped.coachPrograms,
    };
    setSavedContent(local);
    if (!isCloudEnabled || storageScope === "local-device") return;
    let cancelled = false;
    void loadSavedContent(storageScope)
      .then(async (cloud) => {
        if (cancelled) return;
        const merged: SavedContent = {
          favoriteExerciseIds: Array.from(new Set([...local.favoriteExerciseIds, ...cloud.favoriteExerciseIds])),
          favoriteProgramIds: Array.from(new Set([...local.favoriteProgramIds, ...cloud.favoriteProgramIds])),
          myPrograms: Array.from(new Map([...local.myPrograms, ...cloud.myPrograms].map((program) => [program.id, program])).values()),
          coachPrograms: cloud.coachPrograms,
        };
        setSavedContent(merged);
        storage.set(`${savedContentKey}:${storageScope}`, merged);
        await saveSavedContent(storageScope, merged);
        storage.remove(`${savedContentKey}:local-device`);
      })
      .catch((error) => console.warn("Could not load saved programs and favorites", formatError(error)));
    return () => { cancelled = true; };
  }, [isCloudEnabled, storageScope]);

  useEffect(() => {
    if (!isCloudEnabled || storageScope === "local-device") return;
    void syncOnboardingIntake(storageScope).catch((error) =>
      console.warn("Could not sync onboarding answers", formatError(error)),
    );
  }, [isCloudEnabled, storageScope]);

  useEffect(() => {
    void configureWorkoutNotifications();
  }, []);

  useEffect(() => {
    void syncRevenueCatIdentity(isAuthenticated ? storageScope : null).catch((error) =>
      console.warn("Could not configure RevenueCat", formatError(error)),
    );
  }, [isAuthenticated, storageScope]);

  useEffect(() => {
    setAthleteProfile(initialAthleteProfile(storageScope));
    setReminderSettings(
      storage.get<WorkoutReminderSettings>(`${reminderKey}:${storageScope}`, defaultReminderSettings),
    );
    setSettingsPreferences(
      storage.get<SettingsPreferences>(`${settingsKey}:${storageScope}`, defaultSettingsPreferences),
    );
  }, [storageScope]);

  useEffect(() => {
    if (!isCloudEnabled || storageScope === "local-device") {
      return;
    }

    let cancelled = false;

    async function hydrateCloudData() {
      try {
        const existingScopedProfile = storage.get<AthleteProfile | null>(`${profileKey}:${storageScope}`, null);
        const onboarding = storage.get<OnboardingProfile | null>("apex-gym:onboarding-profile", null);
        const onboardingProfile = !existingScopedProfile && onboarding ? buildAthleteProfile(onboarding) : null;
        const data = await loadCloudUserData(storageScope);

        if (onboardingProfile) {
          await saveCloudProfile(storageScope, onboardingProfile);
          data.profile = onboardingProfile;
        }

        if (cancelled) {
          return;
        }

        if (data.profile) {
          setAthleteProfile(data.profile);
          storage.set(`${profileKey}:${storageScope}`, data.profile);
        }
        if (data.reminder) {
          setReminderSettings(data.reminder);
          storage.set(`${reminderKey}:${storageScope}`, data.reminder);
        }
        if (data.settings) {
          setSettingsPreferences(data.settings);
          storage.set(`${settingsKey}:${storageScope}`, data.settings);
        }
        if (data.sessions) {
          setSessionHistory(data.sessions);
        }
      } catch (error) {
        console.warn("Could not load cloud profile data", formatError(error));
      }
    }

    void hydrateCloudData();

    return () => {
      cancelled = true;
    };
  }, [isCloudEnabled, storageScope]);

  const memberLevel = athleteProfile.fitnessLevel.toLowerCase() as Exercise["eligibleLevels"][number];
  const exercises = useMemo(
    () => exerciseCatalog.filter((exercise) => (exercise.eligibleLevels ?? allEligibleLevels).includes(memberLevel)),
    [exerciseCatalog, memberLevel],
  );
  const visiblePrograms = useMemo(
    () => programCatalog.filter((program) => (program.eligibleLevels ?? allEligibleLevels).includes(memberLevel)),
    [memberLevel, programCatalog],
  );

  const featuredExercise =
    exercises.find((exercise) => exercise.id === "ex-bench-press") ?? exercises[0];
  const currentProgram = visiblePrograms[0] ?? trainingPrograms[0];
  const pushExercises = currentProgram.schedule[0]?.exercises ?? todayWorkout.exercises;

  function selectTab(tab: AppDockTab) {
    if (process.env.EXPO_OS !== "web") {
      void Haptics.selectionAsync();
    }
    if (tab === "exercises" || tab === "programs") {
      setCatalogRefreshKey((current) => current + 1);
    }
    setActiveTab(tab);
  }

  function startSession(nextExercises: Exercise[], title: string) {
    setActiveExercise(null);
    setActiveProgram(null);
    setSessionTitle(title);
    setSessionExercises(nextExercises);
  }

  function updateSavedContent(update: (current: SavedContent) => SavedContent) {
    setSavedContent((current) => {
      const next = update(current);
      storage.set(`${savedContentKey}:${storageScope}`, next);
      if (isCloudEnabled) {
        void saveSavedContent(storageScope, next).catch((error) =>
          console.warn("Could not save programs and favorites", formatError(error)),
        );
      }
      return next;
    });
  }

  function toggleSavedId(key: "favoriteExerciseIds" | "favoriteProgramIds", id: string) {
    updateSavedContent((current) => ({
      ...current,
      [key]: current[key].includes(id) ? current[key].filter((item) => item !== id) : [...current[key], id],
    }));
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]">
      <View className="flex-1">
        <Animated.View
          key={activeTab}
          className="flex-1"
          entering={FadeInDown.duration(220)}
          layout={LinearTransition.springify().damping(18)}
        >
          {activeTab === "today" ? (
            <TodayTab
              athleteName={athleteProfile.name}
              completedWorkouts={sessionHistory.length}
              featuredExercise={featuredExercise}
              notificationUnreadCount={notificationUnreadCount}
              onOpenNotifications={() => setNotificationsVisible(true)}
              onOpenCalendar={() => setProgressCalendarVisible(true)}
              onOpenExercise={setActiveExercise}
              onOpenPrograms={() => selectTab("programs")}
              onStartWorkout={() => startSession(pushExercises, "Push Day")}
              recentExercise={exercises.find((exercise) => exercise.id === "ex-lat-pulldown")}
              trainingDaysPerWeek={athleteProfile.trainingDaysPerWeek}
            />
          ) : activeTab === "programs" ? (
            <ProgramsTab
              coachPrograms={savedContent.coachPrograms}
              favoriteProgramIds={savedContent.favoriteProgramIds}
              myPrograms={savedContent.myPrograms}
              onCreateProgram={() => setProgramBuilderVisible(true)}
              onOpenProgram={setActiveProgram}
              onToggleFavorite={(id) => toggleSavedId("favoriteProgramIds", id)}
              programs={visiblePrograms}
            />
          ) : activeTab === "exercises" ? (
            <LibraryTab
              exercises={exercises}
              favoriteExerciseIds={savedContent.favoriteExerciseIds}
              membership={membership}
              onOpenExercise={setActiveExercise}
              onToggleFavorite={(id) => toggleSavedId("favoriteExerciseIds", id)}
            />
          ) : (
            <ProfileTab
              accountEmail={accountEmail}
              isAuthenticated={isAuthenticated}
              isCloudEnabled={isCloudEnabled}
              profile={athleteProfile}
              reminderSettings={reminderSettings}
              settingsPreferences={settingsPreferences}
              sessionHistory={sessionHistory}
              membership={membership}
              userId={storageScope}
              onMembershipRefresh={async () => setMembership(await loadMembership(storageScope))}
              onOpenPlanOffers={() => setPlanOffersVisible(true)}
              onRequestAuth={onRequestAuth}
              onEditProfile={() => setProfileEditorVisible(true)}
              onOpenReminder={() => setReminderVisible(true)}
              onOpenSettings={setSettingsPage}
              onSignOut={onSignOut}
            />
          )}
        </Animated.View>

        <AppDock activeTab={activeTab} onSelectTab={selectTab} />
      </View>

      <ExerciseDetailSheet
        canPlayVideo={membership.videoAccess}
        exercise={activeExercise}
        isVisible={Boolean(activeExercise)}
        onClose={() => setActiveExercise(null)}
        onStart={(exercise) => startSession([exercise], exercise.name)}
      />
      <ProgramDetailSheet
        program={activeProgram}
        onClose={() => setActiveProgram(null)}
        onStart={(program) => {
          const firstSession = program.schedule[0];
          startSession(
            firstSession?.exercises ?? program.exercises,
            firstSession ? `${program.title}: ${firstSession.label}` : program.title,
          );
        }}
      />
      <ProgramBuilderSheet
        exercises={exercises}
        onClose={() => setProgramBuilderVisible(false)}
        onSave={(program) => updateSavedContent((current) => ({ ...current, myPrograms: [program, ...current.myPrograms.filter((item) => item.id !== program.id)] }))}
        visible={programBuilderVisible}
      />
      <PlanOffersSheet
        currentPlan={membership.plan}
        onClose={() => setPlanOffersVisible(false)}
        onSelect={async (plan) => {
          if (isAuthenticated && plan !== "free") await purchaseRevenueCatPlan(plan);
          await onChoosePlan?.(plan);
          if (isCloudEnabled) setMembership(await loadMembership(storageScope));
          setPlanOffersVisible(false);
        }}
        onRestore={async () => {
          await restoreRevenueCatPurchases();
          if (isCloudEnabled) setMembership(await loadMembership(storageScope));
        }}
        visible={planOffersVisible}
      />
      <WorkoutSessionOverlay
        exercises={sessionExercises}
        onClose={() => setSessionExercises(null)}
        onFinishSession={(session) => {
          setSessionHistory((current) => [session, ...current].slice(0, 12));
          if (isCloudEnabled) {
            void saveCloudSession(storageScope, session).catch((error) =>
              console.warn("Could not save workout session", error),
            );
          }
        }}
        title={sessionTitle}
      />
      <NotificationCenter
        onUnreadChange={setNotificationUnreadCount}
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
      <ProgressCalendarSheet
        completedWorkouts={sessionHistory.length}
        plannedWorkouts={athleteProfile.trainingDaysPerWeek}
        visible={progressCalendarVisible}
        onClose={() => setProgressCalendarVisible(false)}
      />
      <WorkoutReminderSheet
        visible={reminderVisible}
        settings={reminderSettings}
        programWeekdays={currentProgram.schedule.map((day) => day.weekday)}
        onClose={() => setReminderVisible(false)}
        onSave={async (settings) => {
          const message = await syncWorkoutReminders(settings);
          setReminderSettings(settings);
          storage.set(`${reminderKey}:${storageScope}`, settings);
          if (isCloudEnabled) {
            await saveCloudSettings(storageScope, settingsPreferences, settings);
          }
          return message;
        }}
      />
      <ProfileEditorSheet
        visible={profileEditorVisible}
        profile={athleteProfile}
        onClose={() => setProfileEditorVisible(false)}
        onSave={(profile) => {
          setAthleteProfile(profile);
          storage.set(`${profileKey}:${storageScope}`, profile);
          if (isCloudEnabled) {
            void saveCloudProfile(storageScope, profile).catch((error) =>
              console.warn("Could not save cloud profile", error),
            );
          }
        }}
      />
      <SettingsDetailSheet
        page={settingsPage}
        preferences={settingsPreferences}
        onClose={() => setSettingsPage(null)}
        onSave={(preferences) => {
          setSettingsPreferences(preferences);
          storage.set(`${settingsKey}:${storageScope}`, preferences);
          if (isCloudEnabled) {
            void saveCloudSettings(storageScope, preferences, reminderSettings).catch((error) =>
              console.warn("Could not save cloud settings", error),
            );
          }
        }}
      />
    </SafeAreaView>
  );
}

function TodayTab({
  athleteName,
  completedWorkouts,
  featuredExercise,
  notificationUnreadCount,
  recentExercise,
  trainingDaysPerWeek,
  onOpenCalendar,
  onOpenNotifications,
  onOpenExercise,
  onOpenPrograms,
  onStartWorkout,
}: {
  athleteName: string;
  completedWorkouts: number;
  featuredExercise: Exercise;
  notificationUnreadCount: number;
  recentExercise?: Exercise;
  trainingDaysPerWeek: number;
  onOpenCalendar: () => void;
  onOpenNotifications: () => void;
  onOpenExercise: (exercise: Exercise) => void;
  onOpenPrograms: () => void;
  onStartWorkout: () => void;
}) {
  return (
    <ScrollView
      className="flex-1 bg-[#F7F8FC]"
      contentContainerClassName="gap-6 px-4 pb-24 pt-3"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader
        athleteName={athleteName}
        notificationUnreadCount={notificationUnreadCount}
        onOpenNotifications={onOpenNotifications}
      />

      <WorkoutHero
        exercise={featuredExercise}
        onOpenExercise={() => onOpenExercise(featuredExercise)}
        onStartWorkout={onStartWorkout}
      />

      <View className="items-center">
        <View className="flex-row gap-1.5">
          {[0, 1, 2, 3, 4].map((item) => (
            <View
              className={`h-2 w-2 rounded-full ${item === 0 ? "bg-electric" : "bg-line"}`}
              key={item}
            />
          ))}
        </View>
      </View>

      <SectionHeader action="See all" onAction={onOpenPrograms} title="Today at a glance" />
      <View className="flex-row gap-2">
        <DailyMetricCard caption="Planned" color={colors.accent} label="Workout" value="Push" />
        <DailyMetricCard caption="Program" color="#2563EB" label="Focus" value="Chest" />
        <DailyMetricCard caption="Session" color="#EA8B00" label="Time" value="60m" />
        <DailyMetricCard caption="Ready" color="#62C83E" label="Data" value="Manual" />
      </View>

      <SectionHeader action="See calendar" onAction={onOpenCalendar} title="This Week Progress" />
      <WeekProgressCard completedWorkouts={completedWorkouts} plannedWorkouts={trainingDaysPerWeek} />

      <SectionHeader action="" title="Recent Workouts" />
      <Pressable
        accessibilityLabel="Open recent workout"
        accessibilityRole="button"
        className="flex-row items-center gap-3 rounded-[22px] border border-line bg-white p-2.5"
        onPress={() => recentExercise && onOpenExercise(recentExercise)}
        style={{ borderCurve: "continuous", boxShadow: "0 14px 34px rgba(17, 19, 24, 0.08)" }}
      >
        <Image
          className="h-20 w-24 rounded-2xl bg-carbon"
          resizeMode="cover"
          source={{ uri: recentExercise?.gifUrl ?? featuredExercise.gifUrl }}
        />
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-black text-bone">Pull Day</Text>
          <Text className="mt-1 text-xs font-semibold text-steel">Back - Biceps - Rear Delt</Text>
          <Text className="mt-1 text-xs text-ash">Yesterday</Text>
        </View>
        <ChevronRight color={colors.steel} size={22} />
      </Pressable>
    </ScrollView>
  );
}

function HomeHeader({
  athleteName,
  notificationUnreadCount,
  onOpenNotifications,
}: {
  athleteName: string;
  notificationUnreadCount: number;
  onOpenNotifications: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <Image
          accessibilityLabel="Profile photo"
          className="h-12 w-12 rounded-full bg-carbon"
          resizeMode="cover"
          source={{
            uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
          }}
        />
        <View className="min-w-0 flex-1">
          <Text className="text-sm text-steel">Good morning,</Text>
          <Text className="text-xl font-black text-bone" numberOfLines={1}>
            {athleteName}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
          onPress={onOpenNotifications}
          style={{ boxShadow: "0 10px 24px rgba(17, 19, 24, 0.08)" }}
        >
          <Bell color={colors.text} size={20} />
          {notificationUnreadCount > 0 ? (
            <View className="absolute right-2 top-2 h-5 min-w-5 items-center justify-center rounded-full bg-electric px-1">
              <Text className="text-[10px] font-black text-white">
                {notificationUnreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <View className="h-10 w-px bg-line" />
        <View className="flex-row items-center gap-1.5">
          <Flame color={colors.accent} fill={colors.accent} size={18} />
          <View>
            <Text className="text-sm font-black text-bone">Start</Text>
            <Text className="text-[10px] text-steel">New plan</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ProgressCalendarSheet({
  completedWorkouts,
  plannedWorkouts,
  visible,
  onClose,
}: {
  completedWorkouts: number;
  plannedWorkouts: number;
  visible: boolean;
  onClose: () => void;
}) {
  const safePlanned = Math.max(1, plannedWorkouts);
  const safeCompleted = Math.max(0, Math.min(completedWorkouts, safePlanned));

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/35">
        <SafeAreaView className="bg-white">
          <View
            className="rounded-t-[30px] bg-white px-5 pb-5 pt-4"
            style={{ boxShadow: "0 -18px 40px rgba(17, 19, 24, 0.16)" }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-electric/10">
                  <CalendarDays color={colors.accent} size={21} />
                </View>
                <View>
                  <Text className="text-xl font-black text-bone">Weekly calendar</Text>
                  <Text className="mt-1 text-xs font-semibold text-ash">
                    {safeCompleted} of {safePlanned} planned workouts
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Close weekly calendar"
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-full bg-carbon"
                onPress={onClose}
              >
                <Text className="text-lg font-black text-steel">X</Text>
              </Pressable>
            </View>

            <WeekProgressCard
              completedWorkouts={safeCompleted}
              large
              plannedWorkouts={safePlanned}
            />

            <View className="mt-4 rounded-[22px] bg-carbon p-4">
              <Text className="text-sm font-black text-bone">Calendar view is ready</Text>
              <Text className="mt-2 text-xs font-semibold leading-5 text-steel">
                Completed sessions will fill this progress automatically. A full day-by-day
                schedule can be added after the workout plan is finalized.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function WorkoutHero({
  exercise,
  onOpenExercise,
  onStartWorkout,
}: {
  exercise: Exercise;
  onOpenExercise: () => void;
  onStartWorkout: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-[28px] bg-electric"
      style={{ borderCurve: "continuous", boxShadow: "0 24px 48px rgba(225, 29, 72, 0.24)" }}
    >
      <ImageBackground className="min-h-[270px]" resizeMode="cover" source={{ uri: heroImage }}>
        <LinearGradient
          className="absolute inset-0"
          colors={["#D00016", "rgba(208,0,22,0.9)", "rgba(208,0,22,0.28)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View className="flex-1 justify-between p-5">
          <View>
            <View className="flex-row items-center gap-2">
              <Trophy color="#FFFFFF" size={14} />
              <Text className="text-xs font-black uppercase text-white">Today's Workout</Text>
            </View>
            <View className="mt-6 flex-row items-center gap-2">
              <Text className="text-3xl font-black text-white">Push Day</Text>
              <Pressable
                accessibilityLabel="Open workout detail"
                accessibilityRole="button"
                className="h-9 w-9 items-center justify-center rounded-full bg-white/25"
                onPress={onOpenExercise}
              >
                <ChevronRight color="#FFFFFF" size={20} />
              </Pressable>
            </View>
            <Text className="mt-2 text-base font-semibold text-white">Chest - Shoulders - Triceps</Text>
            <View className="mt-4 self-start rounded-full bg-white/20 px-3 py-2">
              <Text className="text-xs font-black text-white">Intermediate</Text>
            </View>
          </View>

          <View>
            <View className="flex-row gap-4">
              <HeroInfo icon={<Clock3 color="#FFFFFF" size={16} />} label="60-75 min" />
              <HeroInfo icon={<Dumbbell color="#FFFFFF" size={16} />} label="8 exercises" />
            </View>
            <Pressable
              accessibilityLabel="Start workout"
              accessibilityRole="button"
              className="mt-4 h-14 flex-row items-center justify-between rounded-[18px] bg-white px-5"
              onPress={onStartWorkout}
            >
              <Text className="font-black text-electric">Start Workout</Text>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-electric">
                <Play color="#FFFFFF" fill="#FFFFFF" size={18} />
              </View>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function HeroInfo({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="text-sm font-bold text-white">{label}</Text>
    </View>
  );
}

function ProgramsTab({
  coachPrograms,
  favoriteProgramIds,
  myPrograms,
  onCreateProgram,
  onOpenProgram,
  onToggleFavorite,
  programs,
}: {
  coachPrograms: TrainingProgram[];
  favoriteProgramIds: string[];
  myPrograms: TrainingProgram[];
  onCreateProgram: () => void;
  onOpenProgram: (program: TrainingProgram) => void;
  onToggleFavorite: (id: string) => void;
  programs: TrainingProgram[];
}) {
  const [selectedTab, setSelectedTab] = useState<(typeof programTabs)[number]>("Library");
  const displayedPrograms = selectedTab === "Library"
    ? programs
    : selectedTab === "My Programs"
      ? [...coachPrograms, ...myPrograms]
      : programs.filter((program) => favoriteProgramIds.includes(program.id));

  return (
    <ScrollView
      className="flex-1 bg-[#F7F8FC]"
      contentContainerClassName="gap-5 px-4 pb-24 pt-3"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-4xl font-black text-bone">Programs</Text>
        <Pressable
          accessibilityLabel="Program filters"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
          style={{ boxShadow: "0 10px 24px rgba(17, 19, 24, 0.08)" }}
        >
          <Settings2 color={colors.text} size={22} />
        </Pressable>
      </View>

      <SegmentedControl
        options={programTabs}
        selected={selectedTab}
        onSelect={(tab) => setSelectedTab(tab)}
      />

      <SearchField placeholder="Search programs, goals..." />

      {selectedTab === "My Programs" ? (
        <Pressable
          accessibilityLabel="Create a custom program"
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-center gap-2 rounded-[20px] bg-electric"
          onPress={onCreateProgram}
        >
          <Plus color="#FFFFFF" size={19} strokeWidth={3} />
          <Text className="text-sm font-black uppercase text-white">Create program</Text>
        </Pressable>
      ) : null}

      <SectionHeader action="" title={selectedTab === "Library" ? "All Programs" : selectedTab} />
      <View className="gap-3">
        {displayedPrograms.map((program) => (
          <ProgramRow
            favorite={favoriteProgramIds.includes(program.id)}
            key={program.id}
            onPress={() => onOpenProgram(program)}
            onToggleFavorite={() => onToggleFavorite(program.id)}
            program={program}
          />
        ))}
      </View>
      {!displayedPrograms.length ? <View className="rounded-3xl bg-white p-6"><Text className="text-lg font-black text-bone">Nothing here yet</Text><Text className="mt-2 text-sm leading-6 text-ash">{selectedTab === "Favorites" ? "Tap the heart on any program to keep it here." : selectedTab === "My Programs" ? "Create your own program or wait for a coach assignment." : "No program has been published for your level yet."}</Text></View> : null}
    </ScrollView>
  );
}

function LibraryTab({
  exercises,
  favoriteExerciseIds,
  membership,
  onOpenExercise,
  onToggleFavorite,
}: {
  exercises: Exercise[];
  favoriteExerciseIds: string[];
  membership: MembershipState;
  onOpenExercise: (exercise: Exercise) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const filteredExercises = useMemo(() => {
    const search = query.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesFilter = filter === "all" || exercise.targetMuscle === filter;
      const matchesSearch =
        !search ||
        exercise.name.toLowerCase().includes(search) ||
        exercise.targetMuscle.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [exercises, filter, query]);
  const displayedExercises = useMemo(
    () => [
      ...filteredExercises.filter((exercise) => exercise.id.startsWith("api-")),
      ...filteredExercises.filter((exercise) => !exercise.id.startsWith("api-")),
    ],
    [filteredExercises],
  );

  return (
    <FlatList
      className="flex-1 bg-[#F7F8FC]"
      contentContainerStyle={{ gap: 12, paddingBottom: 112, paddingHorizontal: 16, paddingTop: 12 }}
      contentInsetAdjustmentBehavior="automatic"
      data={displayedExercises}
      initialNumToRender={7}
      keyExtractor={(exercise) => exercise.id}
      ListHeaderComponent={
        <View className="gap-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-bone">Exercise Library</Text>
              <Text className="mt-1 text-sm text-ash">
                {filteredExercises.length} movements found
              </Text>
            </View>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
              <BookOpen color={colors.accent} size={21} />
            </View>
          </View>

          <SearchField onChangeText={setQuery} placeholder="Search by exercise or muscle" value={query} />
          {membership.showAds ? (
            <View className="rounded-[22px] border border-electric/15 bg-white p-4">
              <Text className="text-[10px] font-black uppercase text-electric">Sponsored · Free plan</Text>
              <Text className="mt-2 text-base font-black text-bone">Train without interruptions</Text>
              <Text className="mt-1 text-xs leading-5 text-ash">Plus removes ads and unlocks the owner-recorded exercise videos.</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-3 rounded-[20px] bg-electric/8 p-4">
              <Play color={colors.accent} size={19} />
              <Text className="flex-1 text-sm font-black text-bone">{membership.plan.toUpperCase()} · Exercise videos unlocked</Text>
            </View>
          )}
          <HorizontalFilters selected={filter} onSelect={setFilter} />
        </View>
      }
      maxToRenderPerBatch={6}
      removeClippedSubviews
      renderItem={({ item }) => (
        <ExerciseListRow
          exercise={item}
          favorite={favoriteExerciseIds.includes(item.id)}
          onPress={() => onOpenExercise(item)}
          onToggleFavorite={() => onToggleFavorite(item.id)}
        />
      )}
      showsVerticalScrollIndicator={false}
      updateCellsBatchingPeriod={60}
      windowSize={5}
    />
  );
}

function ProfileTab({
  accountEmail,
  isAuthenticated,
  isCloudEnabled,
  profile,
  reminderSettings,
  settingsPreferences,
  sessionHistory,
  membership,
  userId,
  onMembershipRefresh,
  onOpenPlanOffers,
  onRequestAuth,
  onEditProfile,
  onOpenReminder,
  onOpenSettings,
  onSignOut,
}: {
  accountEmail?: string | null;
  isAuthenticated: boolean;
  isCloudEnabled: boolean;
  profile: AthleteProfile;
  reminderSettings: WorkoutReminderSettings;
  settingsPreferences: SettingsPreferences;
  sessionHistory: CompletedWorkoutSession[];
  membership: MembershipState;
  userId: string;
  onMembershipRefresh: () => Promise<void>;
  onOpenPlanOffers: () => void;
  onRequestAuth?: () => void;
  onEditProfile: () => void;
  onOpenReminder: () => void;
  onOpenSettings: (page: SettingsPage) => void;
  onSignOut?: () => Promise<void>;
}) {
  const totalSets = sessionHistory.reduce((total, session) => total + session.totalSets, 0);
  const bmi = profile.weight / Math.pow(profile.height / 100, 2);
  const reminderSummary = reminderSettings.enabled
    ? `${reminderSettings.weekdays.length} days at ${String(reminderSettings.hour).padStart(
        2,
        "0",
      )}:${String(reminderSettings.minute).padStart(2, "0")}`
    : "Off";

  return (
    <ScrollView
      className="flex-1 bg-[#F7F8FC]"
      contentContainerClassName="gap-5 px-4 pb-24 pt-3"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center rounded-[28px] bg-white p-6">
        <Image
          className="h-24 w-24 rounded-full bg-carbon"
          resizeMode="cover"
          source={{
            uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
          }}
        />
        <Text className="mt-4 text-2xl font-black text-bone">{profile.name}</Text>
        <Text className="mt-1 text-sm font-semibold text-ash">
          {profile.fitnessLevel} - {profile.goal}
        </Text>
        <View className="mt-4 rounded-full bg-carbon px-4 py-2">
          <Text className="text-xs font-black text-steel">
            {isCloudEnabled ? accountEmail ?? "Cloud account" : "Guest · Free plan"}
          </Text>
        </View>
      </View>

      <MembershipCard membership={membership} onRefresh={onMembershipRefresh} onUpgrade={onOpenPlanOffers} userId={userId} />

      <View className="flex-row gap-3">
        <ProgressStat label="Weight" value={profile.weight.toFixed(1)} suffix="kg" />
        <ProgressStat label="Height" value={String(profile.height)} suffix="cm" />
        <ProgressStat label="BMI" value={bmi.toFixed(1)} />
      </View>

      <SectionHeader action="" title="Progress" />
      <View className="flex-row gap-3">
        <ProgressStat
          label="Workouts"
          value={String(isCloudEnabled ? sessionHistory.length : sessionHistory.length || 4)}
        />
        <ProgressStat
          label="Total sets"
          value={String(isCloudEnabled ? totalSets : totalSets || 42)}
        />
        <ProgressStat label="Streak" value="12" />
      </View>

      <WeekProgressCard
        completedWorkouts={sessionHistory.length}
        large
        plannedWorkouts={profile.trainingDaysPerWeek}
      />

      <SectionHeader action="" title="Workout History" />
      <View className="gap-3">
        {(sessionHistory.length ? sessionHistory : isCloudEnabled ? [] : demoSessions).map((session) => (
          <View
            className="rounded-[22px] border border-line bg-white p-4"
            key={session.id}
            style={{ borderCurve: "continuous", boxShadow: "0 14px 34px rgba(17, 19, 24, 0.07)" }}
          >
            <View className="flex-row items-center justify-between gap-4">
              <View>
                <Text className="font-black text-bone">{session.title}</Text>
                <Text className="mt-1 text-xs text-ash">
                  {session.exerciseCount} exercises - {session.totalSets} sets completed
                </Text>
              </View>
              <Text className="text-xs font-black text-electric">
                {new Date(session.completedAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          </View>
        ))}
        {isCloudEnabled && sessionHistory.length === 0 ? (
          <View className="rounded-[22px] border border-line bg-white p-4">
            <Text className="font-black text-bone">No workouts yet</Text>
            <Text className="mt-1 text-xs leading-5 text-ash">
              Your history will appear here after your first completed session.
            </Text>
          </View>
        ) : null}
      </View>

      <View className="rounded-[24px] border border-line bg-white p-4">
        <SectionHeader action="Edit" onAction={onEditProfile} title="Training Preferences" />
        {[
          {
            title: "Gym reminder",
            summary: reminderSummary,
            onPress: onOpenReminder,
          },
          {
            title: "Health profile",
            summary: settingsPreferences.health.join(", "),
            onPress: () => onOpenSettings("health"),
          },
          {
            title: "Equipment profile",
            summary: settingsPreferences.equipment,
            onPress: () => onOpenSettings("equipment"),
          },
          {
            title: "Privacy and data",
            summary: settingsPreferences.privacy.length
              ? settingsPreferences.privacy.join(", ")
              : "No optional data sharing",
            onPress: () => onOpenSettings("privacy"),
          },
        ].map((item, index) => (
          <Pressable
            accessibilityLabel={`Open ${item.title}`}
            accessibilityRole="button"
            className={`flex-row items-center justify-between gap-4 py-4 ${
              index < 3 ? "border-b border-line" : ""
            }`}
            key={item.title}
            onPress={item.onPress}
          >
            <View className="min-w-0 flex-1">
              <Text className="font-black text-bone">{item.title}</Text>
              <Text className="mt-1 text-xs text-ash" numberOfLines={1}>
                {item.summary}
              </Text>
            </View>
            <ChevronRight color={colors.steel} size={20} />
          </Pressable>
        ))}
      </View>
      {isAuthenticated && onSignOut ? (
        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-[20px] border border-line bg-white"
          onPress={() => void onSignOut()}
        >
          <Text className="text-sm font-black uppercase text-electric">Sign out</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="Log in to sync progress"
          accessibilityRole="button"
          className="rounded-[20px] bg-electric p-4"
          onPress={onRequestAuth}
        >
          <Text className="text-center text-sm font-black uppercase text-white">Log in / Create account</Text>
          <Text className="mt-2 text-center text-xs font-semibold leading-5 text-white/80">
            Sync progress, keep your plan, and unlock subscription upgrades.
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

type PlanOffer = {
  code: PlanCode;
  name: string;
  price: string;
  description: string;
  features: string[];
};

const fallbackPlanOffers: PlanOffer[] = [
  { code: "free", name: "Free", price: "0 MAD", description: "Train with the complete exercise library.", features: ["All exercises", "GIF movement guides", "Personal workout tracking", "Includes ads"] },
  { code: "plus", name: "Plus", price: "79 MAD / month", description: "More guidance without interruptions.", features: ["Everything in Free", "Owner-recorded exercise videos", "No ads", "Saved programs and favorites"] },
  { code: "pro", name: "Pro", price: "199 MAD / month", description: "Direct coaching built around your progress.", features: ["Everything in Plus", "Dedicated personal coach", "Direct coach messaging", "Coach-built programs for you"] },
];

function PlanOffersSheet({ currentPlan, onClose, onRestore, onSelect, visible }: { currentPlan: PlanCode; onClose: () => void; onRestore: () => Promise<void>; onSelect: (plan: PlanCode) => Promise<void>; visible: boolean }) {
  const [plans, setPlans] = useState<PlanOffer[]>(fallbackPlanOffers);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(currentPlan === "pro" ? "pro" : currentPlan === "plus" ? "pro" : "plus");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!visible || !supabase) return;
    let cancelled = false;
    void supabase.from("plans").select("code,name,description,monthly_price,currency").eq("active", true).order("sort_order").then(({ data, error }) => {
      if (cancelled || error || !data?.length) return;
      setPlans(fallbackPlanOffers.map((fallback) => {
        const live = data.find((plan) => plan.code === fallback.code);
        return live ? { ...fallback, name: live.name, description: live.description || fallback.description, price: `${Number(live.monthly_price)} ${live.currency}${fallback.code === "free" ? "" : " / month"}` } : fallback;
      }));
    });
    return () => { cancelled = true; };
  }, [visible]);

  async function continueToAccount() {
    if (selectedPlan === currentPlan || busy) return;
    setBusy(true);
    setStatus("");
    try { await onSelect(selectedPlan); } catch (error) { setStatus(formatError(error)); } finally { setBusy(false); }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView className="flex-1 bg-[#F7F8FC]">
        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 120, paddingHorizontal: 18, paddingTop: 16 }} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1"><Text className="text-xs font-black uppercase tracking-[2px] text-electric">Membership</Text><Text className="mt-2 text-4xl font-black leading-[44px] text-bone">Choose your plan</Text><Text className="mt-2 text-sm font-semibold leading-6 text-ash">Compare every benefit first. Login or account creation comes after you choose.</Text></View>
            <Pressable accessibilityLabel="Close plan offers" accessibilityRole="button" className="h-11 w-11 items-center justify-center rounded-full bg-white" onPress={onClose}><X color={colors.text} size={21} /></Pressable>
          </View>
          <Pressable accessibilityLabel="Restore purchases" accessibilityRole="button" className="self-start rounded-full border border-line bg-white px-4 py-2" disabled={busy} onPress={() => { setBusy(true); setStatus(""); void onRestore().catch((error) => setStatus(formatError(error))).finally(() => setBusy(false)); }}><Text className="text-xs font-black text-electric">Restore purchases</Text></Pressable>
          {plans.map((plan) => {
            const selected = selectedPlan === plan.code;
            const current = currentPlan === plan.code;
            return <Pressable accessibilityLabel={`Select ${plan.name} plan`} accessibilityRole="button" accessibilityState={{ selected }} className={`rounded-[28px] border-2 p-5 ${selected ? "border-electric bg-[#FFF1F3]" : "border-line bg-white"}`} key={plan.code} onPress={() => { if (!current) setSelectedPlan(plan.code); }}>
              <View className="flex-row items-start justify-between gap-4"><View className="min-w-0 flex-1"><View className="flex-row items-center gap-2"><Text className="text-2xl font-black text-bone">{plan.name}</Text>{current ? <Text className="rounded-full bg-carbon px-3 py-1 text-[9px] font-black uppercase text-steel">Current</Text> : null}</View><Text className="mt-2 text-sm font-semibold leading-5 text-ash">{plan.description}</Text></View><View className={`h-8 w-8 items-center justify-center rounded-full ${selected ? "bg-electric" : "border-2 border-line"}`}>{selected ? <Check color="#FFFFFF" size={18} strokeWidth={3} /> : null}</View></View>
              <Text className="mt-4 text-lg font-black text-electric">{plan.price}</Text>
              <View className="mt-4 gap-3">{plan.features.map((feature) => <View className="flex-row items-center gap-3" key={feature}><View className="h-6 w-6 items-center justify-center rounded-full bg-electric/10"><Check color={colors.accent} size={14} strokeWidth={3} /></View><Text className="min-w-0 flex-1 text-sm font-semibold text-steel">{feature}</Text></View>)}</View>
            </Pressable>;
          })}
          {status ? <View className="rounded-[20px] bg-electric/10 p-4"><Text className="text-sm font-semibold leading-5 text-bone">{status}</Text></View> : null}
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 border-t border-line bg-white px-5 pb-5 pt-3"><Pressable accessibilityLabel="Continue with selected plan" accessibilityRole="button" className={`h-16 items-center justify-center rounded-[24px] bg-electric ${selectedPlan === currentPlan || busy ? "opacity-40" : ""}`} disabled={selectedPlan === currentPlan || busy} onPress={() => void continueToAccount()}><Text className="text-sm font-black uppercase text-white">{busy ? "Please wait..." : "Continue"}</Text></Pressable></View>
      </SafeAreaView>
    </Modal>
  );
}

function MembershipCard({ membership, onRefresh, onUpgrade, userId }: { membership: MembershipState; onRefresh: () => Promise<void>; onUpgrade?: () => void; userId: string }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const planLabel = membership.plan === "free" ? "Free" : membership.plan === "plus" ? "Plus" : "Pro";

  async function submitMessage() {
    if (!membership.conversationId || !draft.trim() || sending) return;
    setSending(true);
    try {
      await sendMemberMessage(membership.conversationId, userId, draft.trim());
      setDraft("");
      await onRefresh();
    } finally { setSending(false); }
  }

  return (
    <View className="overflow-hidden rounded-[28px] border border-line bg-white" style={{ borderCurve: "continuous", boxShadow: "0 16px 38px rgba(17,19,24,.08)" }}>
      <LinearGradient colors={["#FFF1F3", "#FFFFFF"]} style={{ padding: 18 }}>
        <View className="flex-row items-center justify-between"><View className="flex-row items-center gap-3"><View className="h-11 w-11 items-center justify-center rounded-2xl bg-electric"><Crown color="#fff" size={21} /></View><View><Text className="text-lg font-black text-bone">{planLabel} membership</Text><Text className="mt-0.5 text-xs font-semibold text-ash">{membership.videoAccess ? "Videos unlocked · No ads" : "All exercises · GIF guides · Ads"}</Text></View></View>{membership.plan === "free" ? <Pressable accessibilityLabel="Upgrade membership" accessibilityRole="button" className="rounded-full bg-electric px-4 py-2" onPress={onUpgrade}><Text className="text-[10px] font-black uppercase text-white">Upgrade</Text></Pressable> : <Text className="rounded-full bg-electric/10 px-3 py-2 text-[10px] font-black uppercase text-electric">{planLabel}</Text>}</View>
        {membership.plan === "free" ? <Text className="mt-4 text-sm font-semibold leading-5 text-steel">Upgrade to Plus for owner-recorded exercise videos and an ad-free app. Pro also includes your own coach.</Text> : null}
        {membership.plan === "plus" ? <Text className="mt-4 text-sm font-semibold leading-5 text-steel">Your exercise videos are active. Upgrade to Pro when you want direct support from a dedicated coach.</Text> : null}
      </LinearGradient>
      {membership.plan === "pro" ? <View className="border-t border-line p-4">
        {membership.coach ? <><View className="flex-row items-center gap-3"><View className="h-11 w-11 items-center justify-center rounded-full bg-carbon"><MessageCircle color={colors.accent} size={20} /></View><View><Text className="font-black text-bone">{membership.coach.fullName}</Text><Text className="text-xs text-ash">Your dedicated coach · {membership.coach.email}</Text></View></View>
          <View className="mt-4 max-h-52 gap-2">{membership.messages.slice(-4).map((message) => <View className={`max-w-[88%] rounded-2xl p-3 ${message.senderKind === "member" ? "self-end bg-electric" : "bg-carbon"}`} key={message.id}><Text className={`text-sm font-semibold ${message.senderKind === "member" ? "text-white" : "text-bone"}`}>{message.body}</Text></View>)}</View>
          <View className="mt-3 flex-row gap-2"><TextInput className="min-w-0 flex-1 rounded-2xl border border-line bg-carbon px-4 text-sm font-semibold text-bone" onChangeText={setDraft} placeholder="Message your coach" placeholderTextColor={colors.muted} value={draft} /><Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-electric" disabled={!draft.trim() || sending} onPress={() => void submitMessage()}><Send color="#fff" size={18} /></Pressable></View>
        </> : <View className="items-center py-3"><Crown color={colors.accent} size={26} /><Text className="mt-3 font-black text-bone">Coach assignment pending</Text><Text className="mt-1 text-center text-xs leading-5 text-ash">The admin received your Pro access and will choose the right coach for you. Contact appears here automatically.</Text><Pressable className="mt-4 rounded-full bg-carbon px-4 py-3" onPress={() => void onRefresh()}><Text className="text-xs font-black text-electric">Refresh assignment</Text></Pressable></View>}
      </View> : null}
    </View>
  );
}

function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-[18px] bg-white p-1">
      {options.map((option) => {
        const isSelected = option === selected;

        return (
          <Pressable
            accessibilityLabel={`Select ${option}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={`h-11 flex-1 items-center justify-center rounded-[15px] ${
              isSelected ? "bg-electric" : ""
            }`}
            key={option}
            onPress={() => onSelect(option)}
          >
            <Text className={`text-sm font-black ${isSelected ? "text-white" : "text-steel"}`}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchField({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value?: string;
  onChangeText?: (value: string) => void;
}) {
  return (
    <View className="h-14 flex-row items-center gap-3 rounded-[20px] bg-white px-4">
      <Search color={colors.muted} size={22} />
      <TextInput
        accessibilityLabel={placeholder}
        className="min-w-0 flex-1 text-base font-semibold text-bone"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
      />
      <ListFilter color={colors.steel} size={20} />
    </View>
  );
}

function HorizontalFilters({
  selected = "all",
  onSelect,
}: {
  selected?: LibraryFilter;
  onSelect?: (filter: LibraryFilter) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 pr-4">
        {libraryFilters.map((filter) => {
          const isSelected = filter.id === selected;

          return (
            <Pressable
              accessibilityLabel={`Filter ${filter.label}`}
              accessibilityRole="button"
              className={`rounded-full px-4 py-3 ${isSelected ? "bg-electric" : "bg-white"}`}
              key={filter.id}
              onPress={() => onSelect?.(filter.id)}
            >
              <Text className={`text-sm font-black ${isSelected ? "text-white" : "text-steel"}`}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function PopularExerciseCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${exercise.name}`}
      accessibilityRole="button"
      className="w-72 overflow-hidden rounded-[22px] border border-line bg-white"
      onPress={onPress}
      style={{ borderCurve: "continuous", boxShadow: "0 18px 38px rgba(17, 19, 24, 0.1)" }}
    >
      <ImageBackground
        className="h-48 justify-between bg-white"
        resizeMode="contain"
        source={{ uri: exercise.gifUrl }}
      >
        <LinearGradient
          className="absolute inset-0"
          colors={["rgba(225,29,72,0.08)", "rgba(225,29,72,0.56)"]}
        />
        <View className="flex-row items-start justify-between p-3">
          <View className="rounded-lg bg-electric px-3 py-2">
            <Text className="text-xs font-black text-white">Compound</Text>
          </View>
          <Heart color="#FFFFFF" fill="rgba(255,255,255,0.25)" size={22} />
        </View>
        <View className="p-3">
          <Text className="text-xl font-black text-white" numberOfLines={2}>
            {exercise.name}
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {[exercise.targetMuscle, ...exercise.secondaryMuscles.slice(0, 2)].map((muscle) => (
              <View className="rounded-full bg-white/16 px-3 py-1.5" key={muscle}>
                <Text className="text-xs font-bold capitalize text-white">{muscle}</Text>
              </View>
            ))}
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function ProgramRow({ favorite, program, onPress, onToggleFavorite }: { favorite: boolean; program: TrainingProgram; onPress: () => void; onToggleFavorite: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${program.title}`}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-[22px] border border-line bg-white p-2.5"
      onPress={onPress}
      style={{ borderCurve: "continuous", boxShadow: "0 14px 34px rgba(17, 19, 24, 0.08)" }}
    >
      <Image className="h-20 w-24 rounded-2xl" resizeMode="cover" source={{ uri: program.imageUrl }} />
      <View className="min-w-0 flex-1">
        <Text className="font-black text-bone" numberOfLines={1}>
          {program.title}
        </Text>
        <Text className="mt-1 text-xs font-semibold text-steel">
          {program.level} - {program.sessionsPerWeek} days/week
        </Text>
        <Text className="mt-2 text-xs text-ash" numberOfLines={1}>
          {program.target}
        </Text>
      </View>
      <Pressable accessibilityLabel={`${favorite ? "Remove" : "Add"} ${program.title} favorite`} accessibilityRole="button" className="h-10 w-10 items-center justify-center" onPress={(event) => { event.stopPropagation(); onToggleFavorite(); }}>
        <Heart color={colors.accent} fill={favorite ? colors.accent : "transparent"} size={21} />
      </Pressable>
    </Pressable>
  );
}

function ExerciseListRow({ exercise, favorite, onPress, onToggleFavorite }: { exercise: Exercise; favorite: boolean; onPress: () => void; onToggleFavorite: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`Open ${exercise.name}`}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-[22px] border border-line bg-white p-2.5"
      onPress={onPress}
      style={{ borderCurve: "continuous", boxShadow: "0 14px 34px rgba(17, 19, 24, 0.07)" }}
    >
      <Image
        accessibilityLabel={`${exercise.name} preview`}
        className="h-16 w-16 rounded-2xl bg-white"
        fadeDuration={120}
        resizeMode="contain"
        source={{ uri: exercise.gifUrl }}
      />
      <View className="min-w-0 flex-1">
        <Text className="font-black text-bone" maxFontSizeMultiplier={1.05} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {[exercise.targetMuscle, ...exercise.secondaryMuscles.slice(0, 2)].map((muscle) => (
            <View className="rounded-full bg-carbon px-3 py-1" key={muscle}>
              <Text className="text-[11px] font-semibold capitalize text-steel">{muscle}</Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable accessibilityLabel={`${favorite ? "Remove" : "Add"} ${exercise.name} favorite`} accessibilityRole="button" className="h-10 w-10 items-center justify-center" onPress={(event) => { event.stopPropagation(); onToggleFavorite(); }}>
        <Heart color={colors.accent} fill={favorite ? colors.accent : "transparent"} size={21} />
      </Pressable>
    </Pressable>
  );
}

function DailyMetricCard({
  label,
  value,
  caption,
  color,
}: {
  label: string;
  value: string;
  caption: string;
  color: string;
}) {
  return (
    <View
      className="min-w-0 flex-1 rounded-[16px] border border-line bg-white px-2 py-3"
      style={{ borderCurve: "continuous", boxShadow: "0 10px 26px rgba(17, 19, 24, 0.06)" }}
    >
      <Text className="text-[9px] font-black uppercase text-ash" numberOfLines={1}>
        {label}
      </Text>
      <Text
        className="mt-3 text-lg font-black text-bone"
        maxFontSizeMultiplier={1.05}
        numberOfLines={1}
        style={{ color }}
      >
        {value}
      </Text>
      <Text className="mt-1 text-[11px] font-semibold text-steel" numberOfLines={1}>
        {caption}
      </Text>
    </View>
  );
}

function CircularProgress({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const radius = 27;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * value) / 100;

  return (
    <View className="my-2 h-16 w-16 items-center justify-center">
      <Svg height="64" width="64">
        <Circle
          cx="32"
          cy="32"
          fill="transparent"
          r={radius}
          stroke="#EEF0F5"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx="32"
          cy="32"
          fill="transparent"
          r={radius}
          rotation="-90"
          stroke={color}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          origin="32,32"
        />
      </Svg>
      <Text className="absolute text-center text-sm font-black text-bone">{label}</Text>
    </View>
  );
}

function WeekProgressCard({
  completedWorkouts = 0,
  large = false,
  plannedWorkouts = 6,
}: {
  completedWorkouts?: number;
  large?: boolean;
  plannedWorkouts?: number;
}) {
  const safePlanned = Math.max(1, plannedWorkouts);
  const safeCompleted = Math.max(0, Math.min(completedWorkouts, safePlanned));
  const progressValue = Math.round((safeCompleted / safePlanned) * 100);

  return (
    <View
      className="rounded-[22px] border border-line bg-white p-4"
      style={{ borderCurve: "continuous", boxShadow: "0 14px 34px rgba(17, 19, 24, 0.07)" }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-semibold text-bone">Workouts</Text>
          <Text className="mt-2 text-3xl font-black text-bone">
            {safeCompleted} <Text className="text-xl text-ash">/ {safePlanned}</Text>
          </Text>
        </View>
        <View className="flex-row items-end gap-3">
          {weekBars.map((height, index) => (
            <View className="items-center gap-2" key={`${weekLabels[index]}-${index}`}>
              <View className={`${large ? "h-28" : "h-20"} w-2 justify-end rounded-full bg-line`}>
                <View
                  className={`w-2 rounded-full ${index < safeCompleted ? "bg-electric" : "bg-line"}`}
                  style={{ height: index < safeCompleted ? height : 0 }}
                />
              </View>
              <Text className="text-[10px] font-semibold text-ash">{weekLabels[index]}</Text>
            </View>
          ))}
        </View>
        <CircularProgress color={colors.accent} label={`${progressValue}%`} value={progressValue} />
      </View>
    </View>
  );
}

function ProgressStat({
  value,
  label,
  suffix = "",
}: {
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <View className="min-w-0 flex-1 rounded-[18px] border border-line bg-white p-4">
      <Text className="text-2xl font-black text-bone">
        {value}
        {suffix ? <Text className="text-xs text-ash"> {suffix}</Text> : null}
      </Text>
      <Text className="mt-1 text-[10px] font-black uppercase text-ash">{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-end justify-between">
      <Text className="text-xl font-black text-bone">{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction}>
          <Text className="text-xs font-black text-electric">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const demoSessions: CompletedWorkoutSession[] = [
  {
    completedAt: new Date().toISOString(),
    exerciseCount: 8,
    id: "demo-push",
    title: "Push Day",
    totalSets: 29,
  },
  {
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    exerciseCount: 7,
    id: "demo-pull",
    title: "Pull Day",
    totalSets: 24,
  },
];
