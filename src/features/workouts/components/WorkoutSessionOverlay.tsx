import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Minus,
  Pause,
  Play,
  Plus,
  X,
} from "lucide-react-native";

import { colors } from "../../../theme/colors";
import type { Exercise } from "../types";

export type CompletedWorkoutSession = {
  completedAt: string;
  exerciseCount: number;
  id: string;
  title: string;
  totalSets: number;
};

type WorkoutSessionOverlayProps = {
  exercises: Exercise[] | null;
  title: string;
  onClose: () => void;
  onFinishSession?: (session: CompletedWorkoutSession) => void;
};

type Prescription = {
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
};

const defaultRestSeconds = 30;

export function WorkoutSessionOverlay({
  exercises,
  title,
  onClose,
  onFinishSession,
}: WorkoutSessionOverlayProps) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription>>({});

  const exercise = exercises?.[exerciseIndex] ?? null;
  const prescription = exercise ? prescriptions[exercise.id] : null;
  const workingExercise = useMemo(
    () => (exercise && prescription ? { ...exercise, ...prescription } : exercise),
    [exercise, prescription],
  );

  useEffect(() => {
    if (!isResting || restRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRestRemaining((current) => {
        if (current <= 1) {
          setIsResting(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isResting, restRemaining]);

  useEffect(() => {
    setExerciseIndex(0);
    setCompletedSets(0);
    setIsResting(false);
    setSessionComplete(false);
    setPrescriptions(
      Object.fromEntries(
        (exercises ?? []).map((item) => [
          item.id,
          {
            sets: item.sets,
            reps: item.reps,
            weight: item.weight,
            restSeconds: defaultRestSeconds,
          },
        ]),
      ),
    );
  }, [exercises]);

  if (!workingExercise || !exercises) {
    return null;
  }

  const currentExercise = workingExercise;
  const currentExercises = exercises;
  const progress =
    ((exerciseIndex + completedSets / currentExercise.sets) / currentExercises.length) * 100;

  function updatePrescription(patch: Partial<Prescription>) {
    setPrescriptions((current) => ({
      ...current,
      [currentExercise.id]: {
        sets: currentExercise.sets,
        reps: currentExercise.reps,
        weight: currentExercise.weight,
        restSeconds: currentExercise.restSeconds,
        ...patch,
      },
    }));

    if (patch.sets) {
      setCompletedSets((current) => Math.min(current, Math.max(0, patch.sets! - 1)));
    }

    if (typeof patch.restSeconds === "number" && isResting) {
      setRestRemaining(patch.restSeconds);
    }

    if (process.env.EXPO_OS !== "web") {
      void Haptics.selectionAsync();
    }
  }

  function completeSet() {
    if (sessionComplete) {
      onFinishSession?.({
        completedAt: new Date().toISOString(),
        exerciseCount: currentExercises.length,
        id: `session-${Date.now()}`,
        title,
        totalSets: Object.values(prescriptions).reduce((total, item) => total + item.sets, 0),
      });
      onClose();
      return;
    }

    if (process.env.EXPO_OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const nextCompleted = completedSets + 1;
    if (nextCompleted >= currentExercise.sets) {
      if (exerciseIndex < currentExercises.length - 1) {
        setExerciseIndex((current) => current + 1);
        setCompletedSets(0);
        setIsResting(false);
      } else {
        setCompletedSets(currentExercise.sets);
        setSessionComplete(true);
      }
      return;
    }

    setCompletedSets(nextCompleted);
    setRestRemaining(currentExercise.restSeconds);
    setIsResting(true);
  }

  function moveExercise(direction: number) {
    const nextIndex = Math.max(
      0,
      Math.min(currentExercises.length - 1, exerciseIndex + direction),
    );
    setExerciseIndex(nextIndex);
    setCompletedSets(0);
    setIsResting(false);
    setSessionComplete(false);
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={Boolean(exercises)}
    >
      <SafeAreaView className="flex-1 bg-[#F7F8FC]" style={{ height: "100%" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-[#F7F8FC]"
          style={{ minHeight: 0 }}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            className="flex-1 bg-[#F7F8FC]"
            style={{ backgroundColor: colors.background, flex: 1, minHeight: 0 }}
          >
            <View className="border-b border-line bg-white">
              <View className="w-full max-w-[680px] self-center px-4 pb-3 pt-2">
                <View className="flex-row items-center justify-between">
                  <Pressable
                    accessibilityLabel="Close workout session"
                    accessibilityRole="button"
                    className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
                    onPress={onClose}
                  >
                    <X color={colors.text} size={20} strokeWidth={2.2} />
                  </Pressable>

                  <View className="items-center">
                    <Text className="text-[10px] font-black uppercase text-electric">
                      Live training
                    </Text>
                    <Text className="mt-1 max-w-[230px] text-sm font-black text-bone" numberOfLines={1}>
                      {title}
                    </Text>
                  </View>

                  <View className="h-11 min-w-11 items-center justify-center rounded-full bg-electric px-3">
                    <Text className="text-xs font-black text-white">
                      {exerciseIndex + 1}/{exercises.length}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 h-1 overflow-hidden rounded-full bg-carbon">
                  <Animated.View
                    style={{
                      backgroundColor: colors.accent,
                      borderRadius: 999,
                      height: "100%",
                      width: `${Math.max(3, progress)}%`,
                    }}
                  />
                </View>
              </View>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 24 }}
              contentInsetAdjustmentBehavior="automatic"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ minHeight: 0 }}
            >
              <View className="w-full max-w-[680px] self-center">
                <Animated.View
                  entering={FadeInDown.duration(240)}
                  style={{ paddingHorizontal: 16, paddingTop: 16 }}
                >
                  <View
                    className="w-full overflow-hidden rounded-[28px] border border-line bg-white"
                    style={{
                      aspectRatio: 1,
                      borderCurve: "continuous",
                      boxShadow: "0 18px 40px rgba(17, 19, 24, 0.08)",
                    }}
                  >
                    <Image
                      accessibilityLabel={`${currentExercise.name} live demonstration`}
                      fadeDuration={120}
                      resizeMode="contain"
                      source={{ uri: currentExercise.gifUrl }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                </Animated.View>

                <View className="px-5 pb-3 pt-5">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-xs font-black uppercase text-electric">
                      {currentExercise.targetMuscle} - {currentExercise.equipment}
                    </Text>
                    <Text className="text-xs font-black uppercase text-ash">
                      Set {Math.min(completedSets + 1, currentExercise.sets)} of {currentExercise.sets}
                    </Text>
                  </View>

                  <Text
                    className="mt-2 text-[38px] font-black leading-[42px] text-bone"
                    selectable
                  >
                    {currentExercise.name}
                  </Text>

                  <View
                    className="mt-5 rounded-[26px] border border-line bg-white p-4"
                    style={{ boxShadow: "0 14px 34px rgba(17, 19, 24, 0.07)" }}
                  >
                    <View className="mb-4 flex-row items-center justify-between">
                      <View>
                        <Text className="text-[10px] font-black uppercase text-electric">
                          Your prescription
                        </Text>
                        <Text className="mt-1 text-xs text-ash">
                          Coach suggestion, fully editable by you.
                        </Text>
                      </View>
                      <Dumbbell color={colors.accent} size={20} />
                    </View>

                    <View className="gap-3">
                      <StepperField
                        label="Sets"
                        max={12}
                        min={1}
                        onChange={(sets) => updatePrescription({ sets })}
                        value={currentExercise.sets}
                      />
                      <EditableField
                        keyboardType="numbers-and-punctuation"
                        label="Reps"
                        onChange={(reps) => updatePrescription({ reps: reps || "1" })}
                        value={currentExercise.reps}
                      />
                      <EditableField
                        keyboardType="numbers-and-punctuation"
                        label="Working load"
                        onChange={(weight) => updatePrescription({ weight: weight || "Bodyweight" })}
                        value={currentExercise.weight}
                      />
                      <StepperField
                        label="Recovery"
                        max={300}
                        min={15}
                        onChange={(restSeconds) => updatePrescription({ restSeconds })}
                        step={15}
                        suffix="s"
                        value={currentExercise.restSeconds}
                      />
                    </View>
                  </View>

                  <View className="mt-4 overflow-hidden rounded-[24px] border border-line bg-white">
                    <View className="h-1 bg-electric" />
                    <View className="p-4">
                      <Text className="text-[10px] font-black uppercase text-electric">Coach cue</Text>
                      <Text className="mt-2 text-base font-semibold leading-6 text-steel">
                        {currentExercise.coachCue}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="text-[10px] font-black uppercase text-ash">Set progress</Text>
                    <View className="mt-3 flex-row gap-2">
                      {Array.from({ length: currentExercise.sets }).map((_, index) => (
                        <View
                          className={`h-2 flex-1 rounded-full ${
                            index < completedSets ? "bg-electric" : "bg-carbon"
                          }`}
                          key={`${currentExercise.id}-set-${index}`}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="border-t border-line bg-white px-4 pb-3 pt-3">
              <View className="w-full max-w-[648px] self-center">
                {isResting ? (
                  <View className="h-16 flex-row items-center justify-between rounded-[22px] border border-electric/40 bg-white px-4">
                    <View>
                      <Text className="text-[10px] font-black uppercase text-electric">Recovery</Text>
                      <Text className="mt-1 text-2xl font-black tabular-nums text-bone">
                        {Math.floor(restRemaining / 60)}:
                        {String(restRemaining % 60).padStart(2, "0")}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel="Skip recovery timer"
                      accessibilityRole="button"
                      className="h-11 flex-row items-center gap-2 rounded-[16px] bg-electric px-4"
                      onPress={() => setIsResting(false)}
                    >
                      <Pause color="#FFFFFF" size={18} fill="#FFFFFF" />
                      <Text className="text-xs font-black uppercase text-white">Skip rest</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityLabel={sessionComplete ? "Finish workout" : "Complete current set"}
                    accessibilityRole="button"
                    className="h-16 flex-row items-center justify-center gap-3 rounded-[22px] bg-electric"
                    onPress={completeSet}
                  >
                    <Check color="#FFFFFF" size={22} strokeWidth={3} />
                    <Text className="text-base font-black uppercase text-white">
                      {sessionComplete
                        ? "Finish workout"
                        : completedSets + 1 >= currentExercise.sets
                          ? "Complete exercise"
                          : "Complete set"}
                    </Text>
                  </Pressable>
                )}

                <View className="mt-2 flex-row gap-2">
                  <SessionNavButton
                    disabled={exerciseIndex === 0}
                    icon={<ChevronLeft color={colors.steel} size={17} />}
                    label="Previous"
                    onPress={() => moveExercise(-1)}
                  />
                  <SessionNavButton
                    disabled={exerciseIndex === exercises.length - 1}
                    icon={<ChevronRight color={colors.steel} size={17} />}
                    iconAfter
                    label="Next exercise"
                    onPress={() => moveExercise(1)}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function StepperField({
  label,
  value,
  min,
  max,
  onChange,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <View
      className="min-h-[68px] flex-row items-center rounded-[20px] border border-line bg-[#FFF1F3] px-3 py-2"
      style={{ boxShadow: "0 10px 24px rgba(17, 19, 24, 0.06)" }}
    >
      <Text className="w-[108px] text-[11px] font-black uppercase text-ash">{label}</Text>
      <Pressable
        accessibilityLabel={`Decrease ${label}`}
        className="h-9 w-9 items-center justify-center rounded-xl border border-line bg-white"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Minus color={colors.text} size={17} />
      </Pressable>
      <View className="h-10 min-w-[70px] items-center justify-center rounded-xl bg-white px-3">
        <Text allowFontScaling={false} className="text-center text-lg font-black text-bone">
          {value}
          {suffix}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`Increase ${label}`}
        className="h-9 w-9 items-center justify-center rounded-xl bg-electric"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + step))}
        style={{ boxShadow: "0 10px 24px rgba(255, 77, 87, 0.24)" }}
      >
        <Plus color="#FFFFFF" size={17} />
      </Pressable>
    </View>
  );
}

function EditableField({
  label,
  value,
  keyboardType,
  onChange,
}: {
  label: string;
  value: string;
  keyboardType: "numbers-and-punctuation";
  onChange: (value: string) => void;
}) {
  return (
    <View
      className="min-h-[76px] rounded-[20px] border border-line bg-[#FFF1F3] px-3 py-2"
      style={{ boxShadow: "0 10px 24px rgba(17, 19, 24, 0.06)" }}
    >
      <Text className="text-[11px] font-black uppercase text-ash">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        allowFontScaling={false}
        className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 text-right text-base font-black text-bone"
        keyboardType={keyboardType}
        onChangeText={onChange}
        selectTextOnFocus
        style={{ textAlign: "right" }}
        value={value}
      />
    </View>
  );
}

function SessionNavButton({
  disabled,
  icon,
  iconAfter = false,
  label,
  onPress,
}: {
  disabled: boolean;
  icon: React.ReactNode;
  iconAfter?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className={`h-10 flex-1 flex-row items-center justify-center gap-2 rounded-[18px] border border-line ${
        disabled ? "opacity-30" : ""
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      {!iconAfter ? icon : null}
      <Text className="text-[10px] font-black uppercase text-steel">{label}</Text>
      {iconAfter ? icon : null}
    </Pressable>
  );
}
