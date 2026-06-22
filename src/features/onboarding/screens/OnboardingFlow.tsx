import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Dumbbell,
  Flame,
  Gauge,
  HeartPulse,
  Home,
  Lock,
  Minus,
  MoveHorizontal,
  Plus,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Image,
  ImageBackground,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { assessMedicalClearance } from "../domain/medicalSafety";
import type {
  FitnessLevel,
  FocusArea,
  Gender,
  MainGoal,
  MedicalCondition,
  OnboardingProfile,
  StatementAnswer,
  WorkoutIntensity,
} from "../types";
import { storage } from "../../../utils/storage";

type IconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

type StepKey =
  | "splash"
  | "hero"
  | "coach"
  | "gender"
  | "focus"
  | "goal"
  | "desiredBody"
  | "partBody"
  | "birthYear"
  | "height"
  | "weight"
  | "targetWeight"
  | "role"
  | "injuries"
  | "medical"
  | "workoutFrequency"
  | "partAssessment"
  | "fitnessLevel"
  | "activity"
  | "preferred"
  | "activities"
  | "experience"
  | "statement"
  | "match"
  | "challenge"
  | "coachSelect"
  | "planReady"
  | "paywall"
  | "award";

type OnboardingFlowProps = {
  onComplete: () => void;
};

type Option<T extends string> = {
  value: T;
  title: string;
  subtitle?: string;
  icon?: IconComponent;
  image?: string;
  accent?: string;
};

const accent = "#C5161D";
const accentDark = "#9F1117";
const accentSoft = "#FFF1F3";
const black = "#050507";
const background = "#F7F8FC";
const surface = "#FFFFFF";
const text = "#050507";
const muted = "#6B7280";

const currentYear = 2026;

const imageAssets = {
  hero:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
  social:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85",
  coach:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85",
  genderMale:
    "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=85",
  genderFemale:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=85",
  focus:
    "https://images.unsplash.com/photo-1747213848474-b89023221e20?auto=format&fit=crop&fm=jpg&q=88&w=1200",
  targetCut:
    "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=85",
  targetAthletic:
    "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=85",
  targetMass:
    "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=85",
  challenge:
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=85",
  testimonial:
    "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=900&q=85",
  coachCard:
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=85",
};

const steps: StepKey[] = [
  "splash",
  "hero",
  "gender",
  "focus",
  "goal",
  "desiredBody",
  "partBody",
  "birthYear",
  "height",
  "weight",
  "targetWeight",
  "role",
  "injuries",
  "medical",
  "workoutFrequency",
  "partAssessment",
  "fitnessLevel",
  "activity",
  "preferred",
  "activities",
  "experience",
  "planReady",
  "paywall",
  "award",
];

const genderOptions: Option<Gender>[] = [
  { value: "male", title: "Male", image: imageAssets.genderMale },
  { value: "female", title: "Female", image: imageAssets.genderFemale },
];

const focusOptions: Option<FocusArea>[] = [
  { value: "arms", title: "Arms", accent: "#FF6B35" },
  { value: "shoulders", title: "Shoulders", accent: "#F59E0B" },
  { value: "chest", title: "Chest", accent: "#EF4444" },
  { value: "core", title: "Core", accent: "#10B981" },
  { value: "legs", title: "Legs", accent: "#8B5CF6" },
  { value: "full_body", title: "Full Body", accent: accent },
];

const goalOptions: Option<MainGoal>[] = [
  { value: "lose_weight", title: "Lose Weight", subtitle: "Burn fat and protect joints", icon: Flame },
  { value: "build_muscle", title: "Build Muscle", subtitle: "Strength, hypertrophy, structure", icon: Dumbbell },
  { value: "keep_fit", title: "Keep Fit", subtitle: "Energy, health, confidence", icon: HeartPulse },
  { value: "mobility", title: "Move Better", subtitle: "Posture, recovery, range", icon: Activity },
];

const roleOptions = [
  { value: "student", title: "Student", icon: CalendarDays },
  { value: "full_time", title: "Full-Time Employee", icon: Briefcase },
  { value: "remote", title: "Remote Worker", icon: Home },
  { value: "business", title: "Business Owner", icon: BadgeCheck },
];

const injuryOptions = ["None", "Shoulder", "Wrist", "Knee", "Ankle", "Lower Back"];

const conditionOptions: Option<MedicalCondition>[] = [
  { value: "none", title: "None", subtitle: "No known restrictions", icon: ShieldCheck },
  { value: "controlled_asthma", title: "Controlled asthma", subtitle: "We will avoid aggressive pacing", icon: HeartPulse },
  { value: "hypertension", title: "High blood pressure", subtitle: "Low-impact plan recommended", icon: Activity },
  { value: "pregnancy", title: "Pregnancy", subtitle: "Medical clearance required for intensity", icon: ShieldCheck },
  { value: "severe_joint_injury", title: "Severe joint injury", subtitle: "No heavy loading without clearance", icon: CircleAlert },
  { value: "heart_condition", title: "Heart condition", subtitle: "Blocks strenuous programs", icon: Lock },
  { value: "chest_pain", title: "Chest pain during activity", subtitle: "Blocks strenuous programs", icon: Lock },
  { value: "recent_surgery", title: "Recent surgery", subtitle: "Blocks strenuous programs", icon: Lock },
  { value: "fainting_or_dizziness", title: "Fainting or dizziness", subtitle: "Blocks strenuous programs", icon: Lock },
];

const fitnessOptions: Option<FitnessLevel>[] = [
  { value: "beginner", title: "Beginner", subtitle: "I am new to consistent training", icon: Gauge },
  { value: "intermediate", title: "Intermediate", subtitle: "I work out a few times a week", icon: Gauge },
  { value: "advanced", title: "Advanced", subtitle: "I know my limits and want progression", icon: Gauge },
  { value: "athlete", title: "Athlete", subtitle: "High volume, high intent", icon: Trophy },
];

const intensityOptions: Option<WorkoutIntensity>[] = [
  { value: "easy", title: "Easy to start", subtitle: "Short sessions, clean form", icon: ShieldCheck },
  { value: "light_sweat", title: "Break a light sweat", subtitle: "Balanced intensity", icon: Flame },
  { value: "challenging", title: "A bit challenging", subtitle: "Push safely, adjust when needed", icon: Dumbbell },
];

const activityOptions = [
  "Gym Workout",
  "Dumbbell Workout",
  "HIIT",
  "Mobility",
  "Recovery",
  "Pilates",
  "Yoga",
  "Indoor Walking",
  "Core Training",
  "Posture Workout",
];

const motivationOptions = [
  "Choose the right exercises",
  "Stay consistent",
  "See visible progress",
  "Feel more energetic",
];

const rewardOptions = [
  "Try new clothes",
  "Buy a gift",
  "Book a trip",
  "Share the win",
];

function createInitialProfile(): OnboardingProfile {
  return {
    gender: null,
    focusAreas: ["chest", "shoulders"],
    mainGoal: null,
    birthYear: 1995,
    age: currentYear - 1995,
    heightCm: 175,
    weightKg: 75,
    targetWeightKg: 82,
    targetShapeLevel: 1,
    role: null,
    injuries: [],
    fitnessLevel: "intermediate",
    medicalConditions: ["none"],
    activityLevel: 2,
    workoutDaysPerWeek: 3,
    preferredIntensity: null,
    activities: ["Gym Workout"],
    motivation: [],
    statementAnswer: null,
    reward: null,
  };
}

type OnboardingDraft = {
  profile: OnboardingProfile;
  stepIndex: number;
};

function loadOnboardingDraft(): OnboardingDraft {
  const initialProfile = createInitialProfile();
  const fallback: OnboardingDraft = {
    profile: initialProfile,
    stepIndex: 0,
  };
  const savedDraft = storage.get<OnboardingDraft>("apex-gym:onboarding-draft", fallback);
  return {
    profile: { ...initialProfile, ...savedDraft.profile },
    stepIndex: clamp(savedDraft.stepIndex, 0, steps.length - 1),
  };
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { width } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(() => loadOnboardingDraft().stepIndex);
  const [profile, setProfile] = useState<OnboardingProfile>(() => loadOnboardingDraft().profile);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const step = steps[stepIndex];
  const isDark =
    step === "splash" ||
    step === "hero" ||
    step === "partBody" ||
    step === "partAssessment" ||
    step === "challenge" ||
    step === "award";
  const showProgress =
    stepIndex >= steps.indexOf("gender") &&
    step !== "partBody" &&
    step !== "partAssessment" &&
    step !== "planReady" &&
    step !== "paywall" &&
    step !== "award";
  const completion = Math.max(0.04, (stepIndex + 1) / steps.length);
  const contentWidth = Math.min(width, 520);

  const healthProfile = useMemo(
    () => ({
      age: currentYear - profile.birthYear,
      weightKg: profile.weightKg,
      fitnessLevel: profile.fitnessLevel,
      medicalConditions: profile.medicalConditions,
    }),
    [profile.birthYear, profile.fitnessLevel, profile.medicalConditions, profile.weightKg],
  );

  const clearance = assessMedicalClearance(healthProfile);
  const canGoNext = validateStep(step, profile);

  const updateProfile = (partial: Partial<OnboardingProfile>) => {
    setProfile((current) => ({ ...current, ...partial }));
  };

  useEffect(() => {
    storage.set("apex-gym:onboarding-draft", { profile, stepIndex });
  }, [profile, stepIndex]);

  const goBack = () => {
    setBlockedMessage(null);
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const finishOnboarding = () => {
    storage.set("apex-gym:onboarding-profile", profile);
    storage.remove("apex-gym:onboarding-draft");
    onComplete();
  };

  const goNext = () => {
    if (step === "medical" && clearance.status === "blocked") {
      setBlockedMessage(clearance.message);
      return;
    }

    if (step === "award") {
      finishOnboarding();
      return;
    }

    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  if (blockedMessage) {
    return (
      <SafetyBlockerScreen
        message={blockedMessage}
        onBack={() => {
          setBlockedMessage(null);
          setStepIndex(steps.indexOf("medical"));
        }}
      />
    );
  }

  return (
    <SafeAreaView className={isDark ? "flex-1 bg-black" : "flex-1 bg-[#F7F8FC]"}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={{ width: contentWidth, flex: 1, alignSelf: "center" }}>
        {showProgress ? (
          <TopProgress
            canGoBack={stepIndex > 1}
            completion={completion}
            isDark={isDark}
            onBack={goBack}
          />
        ) : null}
        <Animated.View
          key={step}
          entering={FadeInDown.duration(260).springify().damping(18)}
          style={{ flex: 1 }}
        >
          {renderStep({
            step,
            profile,
            updateProfile,
            goNext,
            goBack,
            canGoNext,
            clearanceMessage: clearance.status === "restricted" ? clearance.message : null,
            onComplete,
            onFinish: finishOnboarding,
          })}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

type RenderStepProps = {
  step: StepKey;
  profile: OnboardingProfile;
  updateProfile: (partial: Partial<OnboardingProfile>) => void;
  goNext: () => void;
  goBack: () => void;
  canGoNext: boolean;
  clearanceMessage: string | null;
  onComplete: () => void;
  onFinish: () => void;
};

function renderStep({
  step,
  profile,
  updateProfile,
  goNext,
  goBack,
  canGoNext,
  clearanceMessage,
  onComplete,
  onFinish,
}: RenderStepProps) {
  switch (step) {
    case "splash":
      return <SplashStep onNext={goNext} />;
    case "hero":
      return <HeroStep onNext={goNext} onSkip={() => {
        storage.remove("apex-gym:onboarding-draft");
        onComplete();
      }} />;
    case "coach":
      return <CoachStep onNext={goNext} />;
    case "gender":
      return (
        <QuestionStep
          title="What's your training profile?"
          subtitle="This helps Apex build a plan that feels personal from day one."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <OptionGrid
            columns={2}
            options={genderOptions}
            selected={[profile.gender].filter(Boolean) as Gender[]}
            onSelect={(value) => updateProfile({ gender: value })}
          />
        </QuestionStep>
      );
    case "focus":
      return (
        <QuestionStep
          title="Choose your focus areas"
          subtitle="Tap every muscle group you want the plan to prioritize."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <FocusMap
            selected={profile.focusAreas}
            onToggle={(value) =>
              updateProfile({ focusAreas: toggleMulti(profile.focusAreas, value) })
            }
          />
          <ChipGrid
            options={focusOptions}
            selected={profile.focusAreas}
            onToggle={(value) =>
              updateProfile({ focusAreas: toggleMulti(profile.focusAreas, value) })
            }
          />
        </QuestionStep>
      );
    case "goal":
      return (
        <QuestionStep
          title="What's your main goal?"
          subtitle="We will use this to suggest training days and exercise emphasis. Nutrition targets stay manual."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <StackedOptions
            options={goalOptions}
            selected={profile.mainGoal}
            onSelect={(value) => updateProfile({ mainGoal: value })}
          />
        </QuestionStep>
      );
    case "desiredBody":
      {
        const targetShape = targetShapeCopy(profile.targetShapeLevel);
        return (
        <MetricStep
          title="Set your target shape"
          eyebrow="Body recomposition"
          value={targetShape.title}
          helper={targetShape.helper}
          icon={Dumbbell}
          visual={
            <BodyShapeSlider
              value={profile.targetShapeLevel}
              onChange={(targetShapeLevel) => updateProfile({ targetShapeLevel })}
            />
          }
          onNext={goNext}
        />
        );
      }
    case "partBody":
      return <DividerStep part="PART 2" title="KNOW YOUR BODY" onNext={goNext} />;
    case "birthYear":
      return (
        <ScrollableYearPickerStep
          value={profile.birthYear}
          onChange={(birthYear) =>
            updateProfile({ birthYear, age: currentYear - birthYear })
          }
          onNext={goNext}
        />
      );
    case "height":
      return (
        <NumberPickerStep
          title="What's your height?"
          subtitle="We use height and weight to calculate the BMI shown in your profile."
          value={profile.heightCm}
          min={130}
          max={220}
          unit="cm"
          onChange={(heightCm) => updateProfile({ heightCm })}
          onNext={goNext}
        />
      );
    case "weight":
      return (
        <NumberPickerStep
          title="What's your current weight?"
          subtitle="This starts your weight log. You still choose working loads before training."
          value={profile.weightKg}
          min={40}
          max={180}
          unit="kg"
          decimals
          onChange={(weightKg) => updateProfile({ weightKg })}
          onNext={goNext}
          summary={<BmiCard heightCm={profile.heightCm} weightKg={profile.weightKg} />}
        />
      );
    case "targetWeight":
      return (
        <NumberPickerStep
          title="What's your target weight?"
          subtitle="A realistic target makes the plan safer and easier to sustain."
          value={profile.targetWeightKg}
          min={40}
          max={180}
          unit="kg"
          decimals
          onChange={(targetWeightKg) => updateProfile({ targetWeightKg })}
          onNext={goNext}
          summary={<ReasonableTargetCard current={profile.weightKg} target={profile.targetWeightKg} />}
        />
      );
    case "role":
      return (
        <QuestionStep
          title="What's your current routine?"
          subtitle="Your schedule changes the best time, length, and frequency."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <StackedOptions
            options={roleOptions}
            selected={profile.role}
            onSelect={(value) => updateProfile({ role: value })}
          />
        </QuestionStep>
      );
    case "injuries":
      return (
        <QuestionStep
          title="Have you had any recent injuries?"
          subtitle="We will remove risky movements and suggest safer alternatives."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <MultiList
            options={injuryOptions}
            selected={profile.injuries}
            onToggle={(value) => updateProfile({ injuries: toggleWithNone(profile.injuries, value) })}
          />
        </QuestionStep>
      );
    case "medical":
      return (
        <QuestionStep
          title="Any medical conditions we should know?"
          subtitle="Safety comes first. Severe conditions block strenuous programs."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          {clearanceMessage ? <SafetyNote message={clearanceMessage} /> : null}
          <StackedOptions<MedicalCondition>
            multi
            options={conditionOptions}
            selected={profile.medicalConditions}
            onSelect={(value) =>
              updateProfile({
                medicalConditions: toggleMedical(profile.medicalConditions, value),
              })
            }
          />
        </QuestionStep>
      );
    case "workoutFrequency":
      return (
        <SliderStep
          title="How often would you like to work out?"
          value={profile.workoutDaysPerWeek}
          min={1}
          max={6}
          labels={["Less", "More"]}
          icon={CalendarDays}
          main={`${profile.workoutDaysPerWeek} times / week`}
          description={
            profile.workoutDaysPerWeek <= 2
              ? "A focused plan with more rest days."
              : profile.workoutDaysPerWeek <= 4
                ? "A strong rhythm for visible progress."
                : "High frequency needs careful load and rest choices."
          }
          onChange={(workoutDaysPerWeek) => updateProfile({ workoutDaysPerWeek })}
          onNext={goNext}
        />
      );
    case "partAssessment":
      return <DividerStep part="PART 3" title="FITNESS ASSESSMENT" onNext={goNext} />;
    case "fitnessLevel":
      return (
        <QuestionStep
          title="How would you rate your fitness level?"
          subtitle="This decides how hard the first week should feel."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <StackedOptions
            options={fitnessOptions}
            selected={profile.fitnessLevel}
            onSelect={(fitnessLevel) => updateProfile({ fitnessLevel })}
          />
        </QuestionStep>
      );
    case "activity":
      return (
        <SliderStep
          title="What's your activity level?"
          value={profile.activityLevel}
          min={0}
          max={4}
          labels={["Sedentary", "Very active"]}
          icon={Activity}
          main={activityCopy(profile.activityLevel)}
          description="This helps Apex suggest a more realistic starting pace."
          onChange={(activityLevel) => updateProfile({ activityLevel })}
          onNext={goNext}
        />
      );
    case "preferred":
      return (
        <QuestionStep
          title="Choose your preferred workout level"
          subtitle="You can change this any time from settings."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <StackedOptions
            options={intensityOptions}
            selected={profile.preferredIntensity}
            onSelect={(preferredIntensity) => updateProfile({ preferredIntensity })}
          />
        </QuestionStep>
      );
    case "activities":
      return (
        <QuestionStep
          title="What activities do you enjoy?"
          subtitle="A plan works better when it includes movements you actually like."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <PillCloud
            options={activityOptions}
            selected={profile.activities}
            onToggle={(value) =>
              updateProfile({ activities: toggleMulti(profile.activities, value) })
            }
          />
        </QuestionStep>
      );
    case "experience":
      return (
        <QuestionStep
          title="How was your past experience with muscle building?"
          subtitle="Pick the statement that feels closest."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <ExperienceGrid
            selected={profile.reward}
            onSelect={(reward) => updateProfile({ reward })}
          />
        </QuestionStep>
      );
    case "statement":
      return (
        <QuestionStep
          title="Feeling in tune with this?"
          subtitle="This helps Apex shape the wording and defaults in your plan."
          footer={<NextButton disabled={!canGoNext} onPress={goNext} />}
        >
          <SpeechBubble text="I find it hard to choose the right exercises for myself." />
          <TwoButtonChoice
            selected={profile.statementAnswer}
            onNo={() => updateProfile({ statementAnswer: "no", motivation: [] })}
            onYes={() =>
              updateProfile({
                statementAnswer: "yes",
                motivation: [motivationOptions[0]],
              })
            }
          />
        </QuestionStep>
      );
    case "match":
      return <MatchScoreStep onNext={goNext} />;
    case "challenge":
      return <ChallengeStep onNext={goNext} />;
    case "coachSelect":
      return <CoachSelectStep onNext={goNext} />;
    case "planReady":
      return <PlanReadyStep profile={profile} onNext={goNext} />;
    case "paywall":
      return <PaywallStep onNext={goNext} onSkip={onFinish} />;
    case "award":
      return <AwardStep onComplete={onFinish} />;
    default:
      return null;
  }
}

function validateStep(step: StepKey, profile: OnboardingProfile) {
  if (step === "gender") return Boolean(profile.gender);
  if (step === "focus") return profile.focusAreas.length > 0;
  if (step === "goal") return Boolean(profile.mainGoal);
  if (step === "role") return Boolean(profile.role);
  if (step === "injuries") return profile.injuries.length > 0;
  if (step === "medical") return profile.medicalConditions.length > 0;
  if (step === "fitnessLevel") return Boolean(profile.fitnessLevel);
  if (step === "preferred") return Boolean(profile.preferredIntensity);
  if (step === "activities") return profile.activities.length > 0;
  if (step === "experience") return Boolean(profile.reward);
  if (step === "statement") return Boolean(profile.statementAnswer);
  return true;
}

function TopProgress({
  canGoBack,
  completion,
  isDark,
  onBack,
}: {
  canGoBack: boolean;
  completion: number;
  isDark: boolean;
  onBack: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 px-5 pb-2 pt-3">
      <Pressable
        accessibilityLabel="Go back"
        disabled={!canGoBack}
        onPress={onBack}
        className={isDark ? "h-11 w-11 items-center justify-center rounded-full bg-white/10" : "h-11 w-11 items-center justify-center rounded-full bg-white"}
        style={isDark ? undefined : { boxShadow: "0 10px 28px rgba(17, 19, 24, 0.08)" }}
      >
        <ArrowLeft color={isDark ? "#FFFFFF" : accent} size={22} strokeWidth={3} opacity={canGoBack ? 1 : 0.25} />
      </Pressable>
      <View className={isDark ? "h-2 flex-1 overflow-hidden rounded-full bg-white/20" : "h-2 flex-1 overflow-hidden rounded-full bg-[#E9ECF4]"}>
        <Animated.View style={{ width: `${completion * 100}%` }} className="h-2 rounded-full bg-[#C5161D]" />
      </View>
      <View className={isDark ? "rounded-full bg-white/10 px-3 py-2" : "rounded-full bg-white px-3 py-2"} style={isDark ? undefined : { boxShadow: "0 10px 28px rgba(17, 19, 24, 0.06)" }}>
        <Text className={isDark ? "text-xs font-black text-white" : "text-xs font-black text-[#C5161D]"}>
          {Math.round(completion * 100)}%
        </Text>
      </View>
    </View>
  );
}

function SplashStep({ onNext }: { onNext: () => void }) {
  return (
    <Pressable onPress={onNext} className="flex-1 items-center justify-center bg-[#AD151B] px-8">
      <Animated.View entering={FadeInDown.duration(460)} className="items-center">
        <Image
          accessibilityLabel="Gym brand"
          source={require("../../../../assets/brand-logo.png")}
          resizeMode="cover"
          style={{ width: 256, height: 256, borderRadius: 32 }}
        />
        <Text className="mt-8 text-center text-4xl font-black uppercase tracking-normal text-white">
          TRAIN WITH INTENT
        </Text>
        <Text className="mt-3 text-center text-base font-bold uppercase text-white/70">
          Strength · Discipline · Progress
        </Text>
      </Animated.View>
      <Text className="absolute bottom-12 text-sm font-bold uppercase text-white/70">
        Tap to start
      </Text>
    </Pressable>
  );
}

function HeroStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <ImageBackground source={{ uri: imageAssets.hero }} resizeMode="cover" className="flex-1">
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.86)"]}
        style={StyleSheet.absoluteFill}
      />
      <View className="flex-1 justify-end px-8 pb-10">
        <Animated.View entering={FadeInDown.delay(80).duration(420)}>
          <Text className="text-7xl font-black uppercase leading-[72px] text-white">
            Train with intent
          </Text>
          <Text className="mt-4 text-2xl font-semibold text-white/90">
            200K+ focused sessions. 4.9 member rating.
          </Text>
          <View className="mt-7 flex-row items-center gap-2">
            {[0, 1, 2, 3, 4].map((item) => (
              <Text key={item} className="text-3xl text-[#FFE76A]">★</Text>
            ))}
          </View>
        </Animated.View>
        <Pressable onPress={onNext} className="mt-10 h-20 items-center justify-center rounded-full bg-[#C5161D]">
          <Text className="text-2xl font-black uppercase text-white">Start</Text>
        </Pressable>
        <Pressable onPress={onSkip} className="mt-5 flex-row items-center justify-center gap-2">
          <Text className="text-lg font-bold text-white/85">Continue with existing plan</Text>
          <ChevronRight color="#FFFFFF" size={22} strokeWidth={3} />
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function CoachStep({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 justify-between bg-[#F7F8FC] px-5 pb-5 pt-8">
      <View className="gap-5">
        <Animated.View entering={FadeInDown.duration(260)} className="overflow-hidden rounded-[30px] bg-white p-5" style={{ boxShadow: "0 18px 44px rgba(17, 19, 24, 0.08)" }}>
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1">
              <Text className="text-xs font-black uppercase text-[#C5161D]">Apex coach</Text>
              <Text className="mt-2 text-4xl font-black leading-[42px] text-black">Let's build your plan</Text>
            </View>
            <Image source={{ uri: imageAssets.coach }} className="h-24 w-24 rounded-[28px] bg-[#E8EEF8]" />
          </View>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(90).duration(260)} className="rounded-[28px] bg-white p-5" style={{ boxShadow: "0 14px 34px rgba(17, 19, 24, 0.06)" }}>
          <Text className="text-2xl font-black leading-8 text-black">
            Answer a few questions and Apex will shape your workouts around your body, schedule, and limits.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(150).duration(260)} className="rounded-[26px] bg-[#FFF1F3] p-5">
          <View className="flex-row items-start gap-3">
            <Sparkles color={accent} size={24} strokeWidth={2.8} />
            <Text className="flex-1 text-base font-bold leading-6 text-[#9F1117]">
              Your answers tune training days, exercise choices, and progression. Nutrition stays manual.
            </Text>
          </View>
        </Animated.View>
      </View>
      <NextButton label="I'm ready" onPress={onNext} />
    </View>
  );
}

function QuestionStep({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [title]);

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 118, paddingTop: 18, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(280)}
          className="rounded-[30px] bg-white p-5"
          style={{ boxShadow: "0 16px 40px rgba(17, 19, 24, 0.07)" }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 rounded-full bg-[#FFF1F3] px-3 py-2">
              <Sparkles color={accent} size={15} strokeWidth={2.6} />
              <Text className="text-xs font-black uppercase text-[#C5161D]">Apex setup</Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#C5161D]">
              <Dumbbell color="#FFFFFF" size={18} strokeWidth={2.8} />
            </View>
          </View>
          <Text className="text-[32px] font-black leading-[37px] text-black">{title}</Text>
          {subtitle ? (
            <Text className="mt-3 text-base font-semibold leading-6 text-[#5F6470]">{subtitle}</Text>
          ) : null}
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(80).duration(260)} className="gap-5">
          {children}
        </Animated.View>
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-[#E9ECF4] bg-white px-5 pb-4 pt-3"
        style={{ boxShadow: "0 -12px 32px rgba(17, 19, 24, 0.08)" }}
      >
        {footer}
      </View>
    </View>
  );
}

function OptionGrid<T extends string>({
  columns,
  options,
  selected,
  onSelect,
}: {
  columns: 1 | 2;
  options: Option<T>[];
  selected: T[];
  onSelect: (value: T) => void;
}) {
  return (
    <View className={columns === 2 ? "flex-row flex-wrap justify-between gap-y-4" : "gap-4"}>
      {options.map((option, index) => {
        const isSelected = selected.includes(option.value);
        const Icon = option.icon;
        return (
          <Animated.View
            key={option.value}
            entering={FadeInUp.delay(index * 55).duration(260)}
            style={{
              width: columns === 2 ? "48%" : "100%",
            }}
          >
          <Pressable
            onPress={() => onSelect(option.value)}
            style={{
              borderColor: isSelected ? accent : "transparent",
              boxShadow: isSelected ? "0 18px 42px rgba(197, 22, 29, 0.18)" : "0 16px 34px rgba(17, 19, 24, 0.07)",
            }}
            className="min-h-[176px] overflow-hidden rounded-[24px] border-2 bg-white"
          >
            {option.image ? (
              <Image source={{ uri: option.image }} className="h-32 w-full bg-[#F1F3F8]" />
            ) : (
              <View className={isSelected ? "h-32 items-center justify-center bg-[#FFF1F3]" : "h-32 items-center justify-center bg-[#F1F3F8]"}>
                {Icon ? <Icon color={accent} size={48} strokeWidth={2.5} /> : null}
              </View>
            )}
            <View className="min-h-16 flex-row items-center justify-between gap-2 p-4">
              <Text className={isSelected ? "min-w-0 flex-1 text-lg font-black text-[#C5161D]" : "min-w-0 flex-1 text-lg font-black text-black"} numberOfLines={2}>
                {option.title}
              </Text>
              {isSelected ? <CheckBadge size="sm" /> : <View className="h-7 w-7 rounded-full bg-[#F1F2F6]" />}
            </View>
          </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function StackedOptions<T extends string>({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: Option<T>[];
  selected: T | T[] | null;
  onSelect: (value: T) => void;
  multi?: boolean;
}) {
  const selectedItems = Array.isArray(selected) ? selected : selected ? [selected] : [];

  return (
    <View className="gap-4">
      {options.map((option, index) => {
        const isSelected = selectedItems.includes(option.value);
        const Icon = option.icon;
        return (
          <Animated.View
            key={option.value}
            entering={FadeInUp.delay(index * 45).duration(250)}
          >
            <Pressable
              onPress={() => onSelect(option.value)}
              style={{
                borderColor: isSelected ? accent : "transparent",
                boxShadow: isSelected ? "0 18px 42px rgba(197, 22, 29, 0.16)" : "0 16px 34px rgba(17, 19, 24, 0.06)",
              }}
              className={isSelected ? "flex-row items-center gap-5 rounded-[26px] border-2 bg-[#FFF1F3] p-5" : "flex-row items-center gap-5 rounded-[26px] border-2 bg-white p-5"}
            >
              <View className={isSelected ? "h-14 w-14 items-center justify-center rounded-2xl bg-[#C5161D]" : "h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F3F8]"}>
                {Icon ? <Icon color={isSelected ? "#FFFFFF" : black} size={28} strokeWidth={2.8} /> : null}
              </View>
              <View className="flex-1">
                <Text className={isSelected ? "text-2xl font-black text-[#C5161D]" : "text-2xl font-black text-black"}>
                  {option.title}
                </Text>
                {option.subtitle ? (
                  <Text className={isSelected ? "mt-1 text-base font-semibold text-[#9F1117]" : "mt-1 text-base font-medium text-[#6B7280]"}>
                    {option.subtitle}
                  </Text>
                ) : null}
              </View>
              {isSelected ? (
                <CheckBadge />
              ) : (
                <View className="h-8 w-8 rounded-full bg-[#F1F2F6]" />
              )}
            </Pressable>
          </Animated.View>
        );
      })}
      {multi ? <Text className="text-center text-xs font-black uppercase text-[#8E94A3]">Multiple selections allowed</Text> : null}
    </View>
  );
}

function ChipGrid<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-3">
      {options.map((option, index) => {
        const isSelected = selected.includes(option.value);
        return (
          <Animated.View
            key={option.value}
            entering={FadeInUp.delay(index * 35).duration(220)}
            style={{ width: "48%" }}
          >
          <Pressable
            onPress={() => onToggle(option.value)}
            style={{ borderColor: isSelected ? accent : "#DDE1EA" }}
            className={isSelected ? "min-h-14 flex-row items-center justify-between rounded-[20px] border-2 bg-[#FFF1F3] px-4 py-3" : "min-h-14 flex-row items-center justify-between rounded-[20px] border-2 bg-white px-4 py-3"}
          >
            <Text className={isSelected ? "min-w-0 flex-1 text-lg font-black text-[#C5161D]" : "min-w-0 flex-1 text-lg font-black text-black"} numberOfLines={1}>
              {option.title}
            </Text>
            <View style={{ backgroundColor: option.accent ?? accent }} className="h-3 w-3 rounded-full" />
          </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function PillCloud({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {options.map((option, index) => {
        const isSelected = selected.includes(option);
        return (
          <Animated.View key={option} entering={FadeInUp.delay(index * 30).duration(220)}>
          <Pressable
            onPress={() => onToggle(option)}
            style={{ borderColor: isSelected ? accent : "#D7DAE2" }}
            className={isSelected ? "rounded-[22px] border-2 bg-[#FFF1F3] px-5 py-4" : "rounded-[22px] border-2 bg-white px-5 py-4"}
          >
            <Text className={isSelected ? "text-xl font-black text-[#C5161D]" : "text-xl font-black text-black"}>{option}</Text>
          </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function MultiList({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View className="gap-4">
      {options.map((option, index) => {
        const isSelected = selected.includes(option);
        return (
          <Animated.View key={option} entering={FadeInUp.delay(index * 45).duration(250)}>
          <Pressable
            onPress={() => onToggle(option)}
            style={{
              borderColor: isSelected ? accent : "transparent",
              boxShadow: isSelected ? "0 18px 42px rgba(197, 22, 29, 0.14)" : "0 16px 34px rgba(17, 19, 24, 0.06)",
            }}
            className={isSelected ? "flex-row items-center justify-between rounded-[26px] border-2 bg-[#FFF1F3] p-6" : "flex-row items-center justify-between rounded-[26px] border-2 bg-white p-6"}
          >
            <Text className={isSelected ? "text-3xl font-black text-[#C5161D]" : "text-3xl font-black text-black"}>{option}</Text>
            {isSelected ? <CheckBadge /> : <View className="h-8 w-8 rounded-full bg-[#F1F2F6]" />}
          </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function FocusMap({
  selected,
  onToggle,
}: {
  selected: FocusArea[];
  onToggle: (value: FocusArea) => void;
}) {
  const selectedSet = new Set(selected);
  const isHot = (area: FocusArea) => selectedSet.has(area) || selectedSet.has("full_body");
  const selectedCount = selectedSet.has("full_body") ? 5 : selected.filter((area) => area !== "full_body").length;
  const hotspots: Array<{
    area: Exclude<FocusArea, "full_body">;
    color: string;
    key: string;
    left: `${number}%`;
    top: `${number}%`;
  }> = [
    { area: "shoulders", color: "#F59E0B", key: "shoulder-left", left: "37%", top: "25%" },
    { area: "shoulders", color: "#F59E0B", key: "shoulder-right", left: "61%", top: "25%" },
    { area: "chest", color: "#EF4444", key: "chest", left: "49%", top: "32%" },
    { area: "arms", color: "#FF6B35", key: "arm-left", left: "33%", top: "39%" },
    { area: "arms", color: "#FF6B35", key: "arm-right", left: "66%", top: "39%" },
    { area: "core", color: "#10B981", key: "core", left: "50%", top: "47%" },
    { area: "legs", color: "#8B5CF6", key: "leg-left", left: "43%", top: "69%" },
    { area: "legs", color: "#8B5CF6", key: "leg-right", left: "57%", top: "69%" },
  ];

  return (
    <View
      className="h-[390px] overflow-hidden rounded-[28px]"
      style={{
        backgroundColor: "#080A0E",
        boxShadow: "0 20px 50px rgba(11, 16, 32, 0.14)",
      }}
    >
      <ImageBackground
        source={{ uri: imageAssets.focus }}
        resizeMode="contain"
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={["rgba(8,10,14,0.72)", "rgba(8,10,14,0)", "rgba(8,10,14,0.92)"]}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View className="absolute left-5 right-5 top-5 z-10 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-black uppercase text-white/60">Interactive muscle map</Text>
            <Text className="mt-1 text-xl font-black text-white">
              {selectedCount > 0 ? `${selectedCount} focus areas` : "Tap a body area"}
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-black/45">
            <Target color="#FFFFFF" size={20} strokeWidth={2.6} />
          </View>
        </View>

        {hotspots.map((hotspot) => {
          const active = isHot(hotspot.area);
          return (
            <Pressable
              accessibilityLabel={`Select ${hotspot.area}`}
              key={hotspot.key}
              onPress={() => onToggle(hotspot.area)}
              style={{
                left: hotspot.left,
                marginLeft: -22,
                marginTop: -22,
                position: "absolute",
                top: hotspot.top,
              }}
              className="h-11 w-11 items-center justify-center rounded-full"
            >
              <View
                style={{
                  backgroundColor: active ? `${hotspot.color}33` : "rgba(255,255,255,0.10)",
                  borderColor: active ? hotspot.color : "rgba(255,255,255,0.6)",
                }}
                className="h-9 w-9 items-center justify-center rounded-full border-2"
              >
                <View
                  style={{ backgroundColor: active ? hotspot.color : "#FFFFFF" }}
                  className="h-2.5 w-2.5 rounded-full"
                />
              </View>
            </Pressable>
          );
        })}

        <View className="absolute bottom-5 left-5 right-5">
          <Text className="text-base font-black text-white">Human focus map</Text>
          <Text className="mt-1 text-sm font-semibold text-white/65">
            Select the muscles you want Apex to prioritize.
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

function BodyShapeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const labels = ["Cut", "Athletic", "Mass"];
  const targetShape = targetShapeCopy(value);

  return (
    <View className="items-center rounded-[34px] bg-white p-5" style={{ boxShadow: "0 20px 50px rgba(11, 16, 32, 0.08)" }}>
      <Image source={{ uri: targetShape.image }} resizeMode="cover" className="h-64 w-full rounded-[26px] bg-[#E8EDF6]" />
      <View className="mt-5 w-full">
        <DraggableScale value={value} min={0} max={2} onChange={onChange} />
      </View>
      <View className="mt-5 w-full flex-row justify-between">
        {labels.map((label, index) => (
          <Pressable key={label} onPress={() => onChange(index)}>
            <Text className={value === index ? "text-xl font-black text-[#C5161D]" : "text-xl font-black text-black"}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MetricStep({
  title,
  eyebrow,
  value,
  helper,
  icon: Icon,
  visual,
  onNext,
}: {
  title: string;
  eyebrow: string;
  value: string;
  helper: string;
  icon: IconComponent;
  visual: ReactNode;
  onNext: () => void;
}) {
  return (
    <View className="flex-1 bg-[#F7F8FC]">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 24, paddingBottom: 104, paddingHorizontal: 24, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-base font-black uppercase text-[#C5161D]">{eyebrow}</Text>
          <Text className="mt-2 text-[42px] font-black leading-[48px] text-black">{title}</Text>
        </View>
        {visual}
        <View className="rounded-[28px] bg-[#FFF1F3] p-5">
          <View className="flex-row items-center gap-3">
            <Icon color={accent} size={28} strokeWidth={2.8} />
            <Text className="text-2xl font-black text-black">{value}</Text>
          </View>
          <Text className="mt-3 text-lg font-semibold leading-7 text-[#536071]">{helper}</Text>
        </View>
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-[#E9ECF4] bg-white px-5 pb-4 pt-3"
        style={{ boxShadow: "0 -12px 32px rgba(17, 19, 24, 0.08)" }}
      >
        <NextButton onPress={onNext} />
      </View>
    </View>
  );
}

function DividerStep({ part, title, onNext }: { part: string; title: string; onNext: () => void }) {
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    const timer = setTimeout(() => onNextRef.current(), 1750);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable onPress={onNext} className="flex-1 justify-center bg-[#AD151B] px-8">
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text className="text-3xl font-light uppercase tracking-[3px] text-white/85">{part}</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(160).duration(520)}>
        <Text className="mt-8 text-6xl font-black uppercase leading-[70px] text-white">{title}</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(360).duration(460)} className="mt-10 flex-row items-center gap-2">
        <View className="h-8 w-20 rounded-full bg-white" />
        <View className="h-8 w-20 rounded-full bg-white/50" />
      </Animated.View>
    </Pressable>
  );
}

function NumberPickerStep({
  title,
  subtitle,
  value,
  min,
  max,
  unit,
  decimals,
  onChange,
  onNext,
  summary,
}: {
  title: string;
  subtitle: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  decimals?: boolean;
  onChange: (value: number) => void;
  onNext: () => void;
  summary?: ReactNode;
}) {
  const step = decimals ? 0.5 : 1;
  const isTarget = title.toLowerCase().includes("target");
  const context =
    unit === "cm"
      ? "Body height"
      : isTarget
        ? "Goal body weight"
        : "Current body weight";
  const Icon = unit === "cm" ? Ruler : Scale;

  return (
    <View className="flex-1 bg-[#F7F8FC]">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 16, paddingBottom: 104, paddingHorizontal: 20, paddingTop: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <MetricQuestionHeader title={title} subtitle={subtitle} />
        <PrecisionDial
          decimals={decimals}
          context={context}
          icon={Icon}
          max={max}
          min={min}
          onChange={onChange}
          step={step}
          unit={unit}
          value={value}
        />
        {summary}
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-[#E9ECF4] bg-white px-5 pb-4 pt-3"
        style={{ boxShadow: "0 -12px 32px rgba(17, 19, 24, 0.08)" }}
      >
        <NextButton onPress={onNext} />
      </View>
    </View>
  );
}

function StepperButton({
  direction,
  onPress,
}: {
  direction: "decrease" | "increase";
  onPress: () => void;
}) {
  const Icon = direction === "decrease" ? Minus : Plus;

  return (
    <Pressable
      accessibilityLabel={direction === "decrease" ? "Decrease value" : "Increase value"}
      onPress={onPress}
      className="h-12 w-12 items-center justify-center rounded-full bg-[#171A1F]"
    >
      <Icon color="#FFFFFF" size={23} strokeWidth={3} />
    </Pressable>
  );
}

function ScrollableYearPickerStep({
  value,
  onChange,
  onNext,
}: {
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-1 bg-[#F7F8FC]">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 16, paddingBottom: 104, paddingHorizontal: 20, paddingTop: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <MetricQuestionHeader
          title="What's your birth year?"
          subtitle="Pick your year so Apex can keep your plan age-aware."
        />
        <PrecisionDial
          context={`${currentYear - value} years old`}
          icon={CalendarDays}
          max={2013}
          min={1950}
          onChange={onChange}
          step={1}
          value={value}
        />
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-[#E9ECF4] bg-white px-5 pb-4 pt-3"
        style={{ boxShadow: "0 -12px 32px rgba(17, 19, 24, 0.08)" }}
      >
        <NextButton onPress={onNext} />
      </View>
    </View>
  );
}

function MetricQuestionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(260)} className="gap-4">
      <Text className="text-[40px] font-black leading-[45px] text-black">{title}</Text>
      <View className="flex-row items-start gap-3 rounded-[24px] bg-[#FFF1F3] p-4">
        <Sparkles color={accent} size={22} strokeWidth={2.8} />
        <Text className="flex-1 text-base font-bold leading-6 text-[#536071]">{subtitle}</Text>
      </View>
    </Animated.View>
  );
}

function PrecisionDial({
  value,
  min,
  max,
  step,
  context,
  icon: Icon,
  decimals,
  unit = "",
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  context: string;
  icon: IconComponent;
  unit?: string;
  decimals?: boolean;
  onChange: (value: number) => void;
}) {
  const lastValueRef = useRef(value);
  const [trackWidth, setTrackWidth] = useState(0);
  const range = max - min;
  const progress = range === 0 ? 0 : clamp((value - min) / range, 0, 1);

  const updateValue = (nextValue: number) => {
    const normalized = Number(clamp(nextValue, min, max).toFixed(decimals ? 1 : 0));
    if (normalized === lastValueRef.current) return;

    lastValueRef.current = normalized;
    onChange(normalized);
    triggerWheelFeedback();
  };

  useEffect(() => {
    lastValueRef.current = value;
  }, [value]);

  const changeByStep = (direction: -1 | 1) => {
    const nextValue = Number((value + step * direction).toFixed(decimals ? 1 : 0));
    updateValue(nextValue);
  };

  const updateFromTrack = (x: number) => {
    if (!trackWidth) return;
    const ratio = clamp(x / trackWidth, 0, 1);
    const rawValue = min + ratio * range;
    const stepped = Math.round(rawValue / step) * step;
    updateValue(stepped);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (event) => updateFromTrack(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateFromTrack(event.nativeEvent.locationX),
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
      }),
    [decimals, max, min, range, step, trackWidth],
  );

  return (
    <Animated.View
      entering={FadeInUp.delay(80).duration(260)}
      className="w-full rounded-[30px] bg-white p-5"
      style={{ boxShadow: "0 18px 45px rgba(17, 19, 24, 0.08)" }}
    >
      <View className="flex-row items-center justify-between">
        <View className="rounded-full bg-[#FFF1F3] px-4 py-2">
          <Text className="text-xs font-black uppercase text-[#C5161D]">{context}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <MoveHorizontal color="#8B93A2" size={17} strokeWidth={2.6} />
          <Text className="text-xs font-black uppercase text-[#8B93A2]">Slide</Text>
        </View>
      </View>

      <View className="mt-7 items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-[22px] bg-[#FFF1F3]">
          <Icon color={accent} size={30} strokeWidth={2.6} />
        </View>
        <View className="flex-row items-baseline justify-center gap-2">
          <Text className="text-[58px] font-black leading-[64px] text-black">
            {formatMetric(value, decimals)}
          </Text>
          <Text className="text-lg font-black uppercase text-[#536071]">{unit || "year"}</Text>
        </View>
      </View>

      <View className="mt-6">
        <View
          {...panResponder.panHandlers}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          className="h-12 justify-center"
        >
          <View style={{ pointerEvents: "none" }} className="h-4 overflow-hidden rounded-full bg-[#E8ECF2]">
            <View
              style={{ pointerEvents: "none", width: `${progress * 100}%` }}
              className="h-4 rounded-full bg-[#C5161D]"
            />
          </View>
          <View
            style={{
              left: `${progress * 100}%`,
              pointerEvents: "none",
              transform: [{ translateX: -16 }],
            }}
            className="absolute h-8 w-8 rounded-full border-4 border-white bg-[#C5161D]"
          />
        </View>
      </View>

      <View className="mt-1 flex-row items-center justify-between px-1">
        <Text className="text-xs font-black text-[#9AA2AF]">
          {formatMetric(min, decimals)} {unit}
        </Text>
        <Text className="text-xs font-black uppercase text-[#9AA2AF]">Drag the bar</Text>
        <Text className="text-xs font-black text-[#9AA2AF]">
          {formatMetric(max, decimals)} {unit}
        </Text>
      </View>

      <View className="mt-5 flex-row items-center justify-center gap-3">
        <StepperButton direction="decrease" onPress={() => changeByStep(-1)} />
        <View className="h-12 min-w-[110px] items-center justify-center rounded-full bg-[#F3F5F8] px-4">
          <Text className="text-sm font-black text-[#536071]">
            {decimals ? `${step.toFixed(1)} step` : `${step} step`}
          </Text>
        </View>
        <StepperButton direction="increase" onPress={() => changeByStep(1)} />
      </View>
    </Animated.View>
  );
}

function cubicPoint(progress: number) {
  const t = clamp(progress, 0, 1);
  const inverse = 1 - t;
  const x =
    inverse ** 3 * 20 +
    3 * inverse ** 2 * t * 58 +
    3 * inverse * t ** 2 * 222 +
    t ** 3 * 260;
  const y =
    inverse ** 3 * 145 +
    3 * inverse ** 2 * t * 34 +
    3 * inverse * t ** 2 * 34 +
    t ** 3 * 145;

  return { x, y };
}

function SliderStep({
  title,
  value,
  min,
  max,
  labels,
  icon: Icon,
  main,
  description,
  onChange,
  onNext,
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  labels: [string, string];
  icon: IconComponent;
  main: string;
  description: string;
  onChange: (value: number) => void;
  onNext: () => void;
}) {
  const points = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <View className="flex-1 bg-[#F7F8FC]">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: 24, paddingBottom: 104, paddingHorizontal: 24, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
      <Text className="text-[42px] font-black leading-[48px] text-black">{title}</Text>
      <View className="items-center gap-6">
        <View className="h-36 w-36 items-center justify-center rounded-[42px] bg-white" style={{ boxShadow: "0 18px 45px rgba(11, 16, 32, 0.10)" }}>
          <Icon color={accent} size={56} strokeWidth={2.5} />
        </View>
        <View className="items-center px-4">
          <Text className="text-center text-4xl font-black text-black">{main}</Text>
          <Text className="mt-4 text-center text-xl font-medium leading-8 text-[#536071]">{description}</Text>
        </View>
        <View className="w-full">
          <DraggableScale value={value} min={min} max={max} onChange={onChange} />
          <View className="mt-6 flex-row justify-between">
            {points.map((point) => (
              <Pressable
                key={point}
                onPress={() => onChange(point)}
                className={point === value ? "h-12 w-12 items-center justify-center rounded-full bg-[#C5161D]" : "h-12 w-12 items-center justify-center rounded-full bg-white"}
              >
                <Text className={point === value ? "text-lg font-black text-white" : "text-lg font-black text-[#A3AAB8]"}>{point}</Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-3 flex-row justify-between">
            <Text className="text-2xl font-black text-black">{labels[0]}</Text>
            <Text className="text-2xl font-black text-black">{labels[1]}</Text>
          </View>
        </View>
      </View>
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-[#E9ECF4] bg-white px-5 pb-4 pt-3"
        style={{ boxShadow: "0 -12px 32px rgba(17, 19, 24, 0.08)" }}
      >
        <NextButton onPress={onNext} />
      </View>
    </View>
  );
}

function DraggableScale({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const percent = ((value - min) / (max - min)) * 100;

  const updateFromPosition = (x: number) => {
    if (!trackWidth) return;
    const ratio = clamp(x / trackWidth, 0, 1);
    onChange(Math.round(min + ratio * (max - min)));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => updateFromPosition(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateFromPosition(event.nativeEvent.locationX),
      }),
    [trackWidth, min, max, onChange],
  );

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      className="h-12 w-full justify-center"
    >
      <View style={{ pointerEvents: "none" }} className="h-5 overflow-hidden rounded-full bg-[#E6EDF7]">
        <View style={{ pointerEvents: "none", width: `${percent}%` }} className="h-5 rounded-full bg-[#C5161D]" />
      </View>
      <View
        style={{ left: `${percent}%`, pointerEvents: "none", transform: [{ translateX: -22 }] }}
        className="absolute h-12 w-12 rounded-full border-4 border-white bg-[#C5161D]"
      />
    </View>
  );
}

function BmiCard({ heightCm, weightKg }: { heightCm: number; weightKg: number }) {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  return (
    <View className="w-full rounded-[28px] bg-[#FFF1F3] p-5">
      <Text className="text-xl font-black text-black">Your current BMI</Text>
      <View className="mt-2 flex-row items-end gap-4">
        <Text className="text-5xl font-black text-[#22C55E]">{bmi.toFixed(1)}</Text>
        <Text className="pb-2 text-lg font-semibold text-[#536071]">Solid starting point. We will progress gradually.</Text>
      </View>
    </View>
  );
}

function ReasonableTargetCard({ current, target }: { current: number; target: number }) {
  const change = ((target - current) / current) * 100;
  const isGain = change >= 0;
  return (
    <View className="w-full rounded-[28px] bg-[#FFF1F3] p-5">
      <Text className="text-xl font-black text-black">Reasonable target</Text>
      <Text className="mt-2 text-lg font-semibold leading-7 text-[#536071]">
        You want to {isGain ? "gain" : "lose"} {Math.abs(change).toFixed(1)}% body weight. Apex will keep weekly progress sustainable.
      </Text>
    </View>
  );
}

function SafetyNote({ message }: { message: string }) {
  return (
    <View className="flex-row gap-4 rounded-[28px] bg-[#FFF7E8] p-5">
      <CircleAlert color="#B45309" size={28} strokeWidth={2.8} />
      <Text className="flex-1 text-base font-bold leading-6 text-[#8A4B00]">{message}</Text>
    </View>
  );
}

function SafetyBlockerScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <StatusBar style="light" />
      <View className="flex-1 justify-between px-7 py-8">
        <Pressable onPress={onBack} className="h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <ArrowLeft color="#FFFFFF" size={26} strokeWidth={3} />
        </Pressable>
        <View>
          <View className="mb-8 h-24 w-24 items-center justify-center rounded-[32px] bg-[#FF5A5F]/15">
            <Lock color="#FF5A5F" size={48} strokeWidth={2.5} />
          </View>
          <Text className="text-5xl font-black leading-[58px] text-white">Medical clearance required</Text>
          <Text className="mt-5 text-xl font-semibold leading-8 text-white/70">{message}</Text>
          <View className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
            <Text className="text-lg font-bold leading-7 text-white/80">
              Strenuous plans, heavy lifting, and high-intensity programs are locked. Please consult a physician before starting.
            </Text>
          </View>
        </View>
        <Pressable onPress={onBack} className="h-20 items-center justify-center rounded-full bg-white">
          <Text className="text-xl font-black text-black">Update answers</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ExperienceGrid({ selected, onSelect }: { selected: string | null; onSelect: (value: string) => void }) {
  const cards = [
    { title: "Never succeeded", color: "#FFB703", path: "M25 60 C70 52 105 56 140 64" },
    { title: "Lost muscle later", color: "#C5161D", path: "M25 92 C55 15 93 19 102 67 C110 104 130 108 150 97" },
    { title: "Strong, not now", color: "#EF4444", path: "M25 32 C70 33 116 56 150 116" },
    { title: "Ready to aim higher", color: "#22C55E", path: "M25 102 C60 93 83 52 150 42" },
  ];

  return (
    <View className="flex-row flex-wrap gap-4">
      {cards.map((card, index) => {
        const isSelected = selected === card.title;
        return (
          <Animated.View
            key={card.title}
            entering={FadeInUp.delay(index * 45).duration(250)}
            style={{
              width: "47%",
            }}
          >
          <Pressable
            onPress={() => onSelect(card.title)}
            style={{
              borderColor: isSelected ? accent : "transparent",
              boxShadow: isSelected ? "0 18px 42px rgba(197, 22, 29, 0.15)" : "0 16px 34px rgba(17, 19, 24, 0.06)",
            }}
            className={isSelected ? "h-52 justify-between rounded-[26px] border-2 bg-[#FFF1F3] p-4" : "h-52 justify-between rounded-[26px] border-2 bg-white p-4"}
          >
            <Svg width="100%" height="72" viewBox="0 0 170 130">
              <Path d={card.path} fill="none" stroke={card.color} strokeLinecap="round" strokeWidth="9" />
              <Path d={`${card.path} L150 125 L25 125 Z`} fill={card.color} opacity="0.08" />
            </Svg>
            <Text className={isSelected ? "text-center text-2xl font-black text-[#C5161D]" : "text-center text-2xl font-black text-black"}>{card.title}</Text>
          </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

function SpeechBubble({ text: bubbleText }: { text: string }) {
  return (
    <View className="items-center">
      <View className="max-w-[360px] rounded-[44px] bg-[#36C950] p-8">
        <Text className="text-center text-3xl font-black leading-[38px] text-white">{bubbleText}</Text>
      </View>
      <View className="-mt-2 h-10 w-10 rotate-45 bg-[#36C950]" />
    </View>
  );
}

function TwoButtonChoice({
  selected,
  onNo,
  onYes,
}: {
  selected: StatementAnswer | null;
  onNo: () => void;
  onYes: () => void;
}) {
  const noSelected = selected === "no";
  const yesSelected = selected === "yes";

  return (
    <View className="flex-row gap-5">
      <Animated.View entering={FadeInUp.duration(240)} className="flex-1">
      <Pressable
        onPress={onNo}
        style={{ borderColor: noSelected ? "#EF4444" : "transparent" }}
        className={noSelected ? "h-44 items-center justify-center gap-4 rounded-[26px] border-2 bg-[#FFF0F0]" : "h-44 items-center justify-center gap-4 rounded-[26px] border-2 bg-white"}
      >
        <X color="#EF4444" size={52} strokeWidth={3} />
        <Text className={noSelected ? "text-3xl font-black text-[#EF4444]" : "text-3xl font-black text-black"}>No</Text>
      </Pressable>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(70).duration(240)} className="flex-1">
      <Pressable
        onPress={onYes}
        style={{ borderColor: yesSelected ? accent : "transparent" }}
        className={yesSelected ? "h-44 items-center justify-center gap-4 rounded-[26px] border-2 bg-[#FFF1F3]" : "h-44 items-center justify-center gap-4 rounded-[26px] border-2 bg-white"}
      >
        <Check color={accent} size={56} strokeWidth={3} />
        <Text className={yesSelected ? "text-3xl font-black text-[#C5161D]" : "text-3xl font-black text-black"}>Yes</Text>
      </Pressable>
      </Animated.View>
    </View>
  );
}

function MatchScoreStep({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 justify-between px-7 pb-6 pt-10">
      <View className="items-center gap-8">
        <Text className="text-center text-4xl font-black leading-[48px] text-black">
          Your plan inputs are ready
        </Text>
        <View className="h-72 w-72 items-center justify-center">
          <View className="absolute h-72 w-72 rotate-12 rounded-[90px] bg-white/20" />
          <View className="absolute h-64 w-64 -rotate-12 rounded-[80px] bg-[#C5161D]/75" />
          <Check color="#FFFFFF" size={112} strokeWidth={4} />
        </View>
        <Text className="text-center text-2xl font-medium leading-9 text-[#4B5563]">
          Apex will build from your goal, schedule, equipment and exercise preferences without
          inventing a match percentage.
        </Text>
      </View>
      <NextButton onPress={onNext} />
    </View>
  );
}

function ChallengeStep({ onNext }: { onNext: () => void }) {
  return (
    <ImageBackground source={{ uri: imageAssets.challenge }} resizeMode="cover" className="flex-1">
      <LinearGradient
        colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.86)"]}
        style={StyleSheet.absoluteFill}
      />
      <View className="flex-1 justify-end px-7 pb-8">
        <Text className="text-5xl font-black leading-[58px] text-white">
          Prepared to boost your energy and self-confidence?
        </Text>
        <Pressable onPress={onNext} className="mt-10 h-20 items-center justify-center rounded-[26px] bg-white">
          <Text className="text-2xl font-black text-black">Yes, I'm Ready</Text>
        </Pressable>
        <Pressable onPress={onNext} className="mt-5 items-center">
          <Text className="text-2xl font-semibold text-white/85">Not Really</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function CoachSelectStep({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 justify-between px-7 pb-6 pt-8">
      <View>
        <View className="flex-row items-start justify-between">
          <Text className="max-w-[260px] text-5xl font-black leading-[56px] text-black">Choose your guide coach</Text>
          <Image source={{ uri: imageAssets.coach }} className="h-24 w-24 rounded-full bg-[#E8EEF8]" />
        </View>
        <View className="mt-10 overflow-hidden rounded-[34px] bg-white" style={{ boxShadow: "0 20px 50px rgba(11, 16, 32, 0.10)" }}>
          <Image source={{ uri: imageAssets.coach }} className="h-72 w-full bg-[#E8EDF6]" />
          <View className="p-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-5xl font-black uppercase text-black">Kai</Text>
              <CheckBadge />
            </View>
            <Text className="text-xl font-semibold leading-8 text-[#4B5563]">
              Strength coach focused on safe progression, consistency, and clean technique.
            </Text>
          </View>
        </View>
      </View>
      <NextButton onPress={onNext} />
    </View>
  );
}

function PlanReadyStep({ profile, onNext }: { profile: OnboardingProfile; onNext: () => void }) {
  return (
    <View className="flex-1 justify-between px-7 pb-6 pt-8">
      <View>
        <Text className="text-3xl font-medium leading-[42px] text-black">
          Your tailored <Text className="font-black text-[#C5161D]">{goalLabel(profile.mainGoal)}</Text> plan is ready.
        </Text>
        <View className="mt-10 flex-row gap-4">
          <View className="flex-1 rounded-[28px] bg-[#F0F2F6] p-5">
            <Text className="text-sm font-black uppercase text-[#7B8492]">Current</Text>
            <Text className="mt-3 text-4xl font-black text-black">{profile.weightKg} kg</Text>
          </View>
          <View className="flex-1 rounded-[28px] bg-[#FCEBEC] p-5">
            <Text className="text-sm font-black uppercase text-[#C5161D]">Your target</Text>
            <Text className="mt-3 text-4xl font-black text-[#C5161D]">{profile.targetWeightKg} kg</Text>
          </View>
        </View>
        <Text className="mt-8 text-center text-2xl font-black leading-9 text-black">
          No completion date is predicted. Your actual trend will use the measurements you log.
        </Text>
      </View>
      <Pressable onPress={onNext} className="h-20 items-center justify-center rounded-full bg-[#C5161D]">
        <Text className="text-2xl font-black uppercase text-white">Get my plan</Text>
      </Pressable>
    </View>
  );
}

function PaywallStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <View className="flex-1 justify-between px-7 pb-6 pt-8">
      <View>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onSkip} className="h-12 w-12 items-center justify-center rounded-full bg-[#E1E4EC]">
            <X color="#858B98" size={28} strokeWidth={3} />
          </Pressable>
          <Pressable onPress={onSkip}>
            <Text className="text-xl font-bold text-[#6B7280] underline">Restore</Text>
          </Pressable>
        </View>
        <View className="mt-8 items-center">
          <Dumbbell color={black} size={74} strokeWidth={2.4} />
          <Text className="mt-6 text-center text-5xl font-black italic leading-[56px] text-black">
            GET YOUR PERSONALIZED PLAN
          </Text>
        </View>
        <View className="mt-10 gap-5">
          <PlanOption title="Free 7-Day Trial" price="US$39.99/year" weekly="US$0.83/week" hot />
          <PlanOption title="Monthly Plan" price="US$9.99/month" weekly="US$2.50/week" />
        </View>
        <View className="mt-8 flex-row justify-center gap-2">
          <Check color="#22C55E" size={24} strokeWidth={3} />
          <Text className="text-xl font-bold text-black">No payment now</Text>
        </View>
      </View>
      <NextButton label="Continue" accentBlue onPress={onNext} />
    </View>
  );
}

function PlanOption({
  title,
  price,
  weekly,
  hot,
}: {
  title: string;
  price: string;
  weekly: string;
  hot?: boolean;
}) {
  return (
    <View
      style={{ borderColor: hot ? accent : "transparent" }}
      className={hot ? "rounded-[24px] border-4 bg-[#EAF3FF] p-5" : "rounded-[24px] border-4 bg-[#F1F3F8] p-5"}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className={hot ? "text-2xl font-black text-[#C5161D]" : "text-2xl font-black text-black"}>{title}</Text>
          <Text className="mt-1 text-lg font-semibold text-[#4B5563]">{price}</Text>
        </View>
        <Text className="text-base font-bold text-[#6B7280]">{weekly}</Text>
      </View>
      {hot ? (
        <View className="absolute -right-2 -top-5 rounded-xl bg-[#C5161D] px-4 py-2">
          <Text className="text-sm font-black uppercase text-white">Hottest</Text>
        </View>
      ) : null}
    </View>
  );
}

function AwardStep({ onComplete }: { onComplete: () => void }) {
  return (
    <ImageBackground source={{ uri: imageAssets.hero }} resizeMode="cover" className="flex-1">
      <LinearGradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.88)"]} style={StyleSheet.absoluteFill} />
      <View className="flex-1 justify-between px-7 pb-8 pt-10">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-2xl font-black uppercase tracking-[2px] text-white">Awards</Text>
            <Text className="mt-4 text-5xl font-black uppercase leading-[56px] text-white">First day{"\n"}with us</Text>
            <Text className="mt-4 text-2xl font-semibold text-white/75">Jun 9, 2026</Text>
          </View>
          <Pressable onPress={onComplete}>
            <X color="#FFFFFF" size={34} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View className="items-center">
          <View className="h-52 w-52 items-center justify-center rounded-[64px] bg-white/90">
            <Svg width="150" height="150" viewBox="0 0 150 150">
              <Defs>
                <SvgLinearGradient id="badge" x1="0" x2="1" y1="0" y2="1">
                  <Stop offset="0" stopColor="#FF5A5F" />
                  <Stop offset="0.45" stopColor="#FFD166" />
                  <Stop offset="1" stopColor="#FFFFFF" />
                </SvgLinearGradient>
              </Defs>
              <Rect x="18" y="18" width="114" height="114" rx="30" fill="url(#badge)" stroke="#111827" strokeWidth="5" />
              <Path d="M36 104 L101 39 M42 42 L42 112 M72 112 L120 64" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" />
            </Svg>
          </View>
          <Text className="mt-10 text-center text-xl font-semibold leading-8 text-white/75">
            Congrats. You earned a new award for joining your first professional training plan.
          </Text>
        </View>
        <View className="gap-4">
          <Pressable onPress={onComplete} className="h-20 items-center justify-center rounded-full bg-white">
            <Text className="text-2xl font-black text-black">Done</Text>
          </Pressable>
          <Pressable className="h-20 items-center justify-center rounded-full bg-white/25">
            <Text className="text-2xl font-black text-white">Share</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

function ProgressCurve({ current, target, date }: { current: number; target: number; date: string }) {
  return (
    <View className="mt-8 h-80 overflow-hidden rounded-[34px] bg-white p-4" style={{ boxShadow: "0 20px 50px rgba(11, 16, 32, 0.08)" }}>
      <Svg width="100%" height="100%" viewBox="0 0 360 270">
        <Defs>
          <SvgLinearGradient id="curveStroke" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="#EF1747" />
            <Stop offset="0.55" stopColor="#7857FF" />
            <Stop offset="1" stopColor="#C5161D" />
          </SvgLinearGradient>
          <SvgLinearGradient id="curveFill" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#EF233C" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Path d="M10 205 C70 205 65 150 112 132 C158 115 168 118 205 78 C246 35 282 48 342 38 L342 250 L10 250 Z" fill="url(#curveFill)" />
        <Path d="M10 205 C70 205 65 150 112 132 C158 115 168 118 205 78 C246 35 282 48 342 38" fill="none" stroke="url(#curveStroke)" strokeLinecap="round" strokeWidth="10" />
        <Circle cx="38" cy="205" r="13" fill="#FFFFFF" stroke="#EF1747" strokeWidth="5" />
        <Circle cx="185" cy="96" r="10" fill="#FFFFFF" stroke="#7857FF" strokeWidth="4" />
        <Circle cx="321" cy="42" r="10" fill="#FFFFFF" stroke="#C5161D" strokeWidth="4" />
        <Rect x="258" y="62" width="84" height="60" rx="18" fill="#C5161D" />
        <SvgText x="300" y="98" textAnchor="middle" fontSize="21" fontWeight="900" fill="#FFFFFF">{date}</SvgText>
        <SvgText x="20" y="236" fontSize="18" fontWeight="800" fill="#111827">Today</SvgText>
        <SvgText x="10" y="262" fontSize="18" fontWeight="700" fill="#6B7280">{formatMetric(current, true)} kg</SvgText>
        <SvgText x="268" y="262" fontSize="18" fontWeight="700" fill="#6B7280">{formatMetric(target, true)} kg</SvgText>
      </Svg>
    </View>
  );
}

function NextButton({
  label = "Next",
  disabled,
  accentBlue,
  onPress,
}: {
  label?: string;
  disabled?: boolean;
  accentBlue?: boolean;
  onPress: () => void;
}) {
  const activeColors: readonly [string, string] = accentBlue ? [accent, accentDark] : [accent, accentDark];

  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={disabled ? "items-center justify-center rounded-[22px] bg-[#C9CDD5]" : "overflow-hidden rounded-[22px]"}
      style={
        disabled
          ? { height: 60 }
          : { boxShadow: "0 16px 30px rgba(197, 22, 29, 0.22)", height: 60 }
      }
    >
      {disabled ? (
        <Text className="text-xl font-black uppercase text-white">{label}</Text>
      ) : (
        <LinearGradient
          colors={activeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: 8,
            height: 60,
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Text className="text-xl font-black uppercase text-white">{label}</Text>
          <ChevronRight color="#FFFFFF" size={22} strokeWidth={3} />
        </LinearGradient>
      )}
    </Pressable>
  );
}

function CheckBadge({ size = "md" }: { size?: "sm" | "md" }) {
  const dimension = size === "sm" ? 30 : 36;
  const iconSize = size === "sm" ? 19 : 22;

  return (
    <View
      className="items-center justify-center rounded-full bg-[#C5161D]"
      style={{ height: dimension, width: dimension }}
    >
      <Check color="#FFFFFF" size={iconSize} strokeWidth={3.5} />
    </View>
  );
}

function toggleMulti<T extends string>(items: T[], value: T) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function toggleWithNone(items: string[], value: string) {
  if (value === "None") return ["None"];
  const next = toggleMulti(items.filter((item) => item !== "None"), value);
  return next.length === 0 ? [] : next;
}

function toggleMedical(items: MedicalCondition[], value: MedicalCondition): MedicalCondition[] {
  if (value === "none") return ["none"];
  const withoutNone: MedicalCondition[] = items.filter((item) => item !== "none");
  const next: MedicalCondition[] = withoutNone.includes(value)
    ? withoutNone.filter((item) => item !== value)
    : [...withoutNone, value];

  return next.length === 0 ? [] : next;
}

function triggerWheelFeedback() {
  if (process.env.EXPO_OS === "web") return;
  void Haptics.selectionAsync().catch(() => undefined);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatMetric(value: number, decimals?: boolean) {
  return decimals ? value.toFixed(1) : Math.round(value).toString();
}

function activityCopy(level: number) {
  if (level <= 0) return "Mostly sedentary";
  if (level === 1) return "Occasional walks";
  if (level === 2) return "Light weekly exercise";
  if (level === 3) return "Active most weeks";
  return "Very active";
}

function targetShapeCopy(level: number) {
  if (level <= 0) {
    return {
      title: "Cut",
      helper: "Apex will bias fat loss, conditioning, and joint-friendly strength work.",
      image: imageAssets.targetCut,
    };
  }

  if (level >= 2) {
    return {
      title: "Mass",
      helper: "Apex will favor muscle-focused strength work with more training volume.",
      image: imageAssets.targetMass,
    };
  }

  return {
    title: "Athletic",
    helper: "Apex will favor lean strength with controlled fat gain and balanced conditioning.",
    image: imageAssets.targetAthletic,
  };
}

function goalLabel(goal: MainGoal | null) {
  if (goal === "lose_weight") return "fat loss";
  if (goal === "build_muscle") return "muscle building";
  if (goal === "mobility") return "mobility";
  return "fitness";
}
