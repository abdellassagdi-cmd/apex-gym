import * as Haptics from "expo-haptics";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BadgeCheck,
  ChevronLeft,
  CirclePlay,
  Clock3,
  Dumbbell,
  ListChecks,
  Minus,
  Plus,
  Target,
} from "lucide-react-native";

import { colors } from "../../../theme/colors";
import type { Exercise } from "../types";

type ExerciseDetailSheetProps = {
  exercise: Exercise | null;
  isVisible: boolean;
  onClose: () => void;
  onStart?: (exercise: Exercise) => void;
  canPlayVideo?: boolean;
};

export function ExerciseDetailSheet({
  exercise,
  isVisible,
  onClose,
  onStart,
  canPlayVideo = false,
}: ExerciseDetailSheetProps) {
  const [draft, setDraft] = useState(exercise);
  const { height: viewportHeight } = useWindowDimensions();

  useEffect(() => {
    setDraft(exercise);
  }, [exercise]);

  if (!exercise) {
    return null;
  }

  const displayedExercise = draft ?? exercise;

  function updateDraft(patch: Partial<Exercise>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    if (process.env.EXPO_OS !== "web") {
      void Haptics.selectionAsync();
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      statusBarTranslucent
      visible={isVisible}
    >
      <SafeAreaView
        className="flex-1 bg-[#F7F8FC]"
        style={{ flex: 1, height: viewportHeight, minHeight: 0 }}
      >
        <Animated.View
          entering={FadeIn.duration(180)}
          className="flex-1 bg-[#F7F8FC]"
          style={{
            backgroundColor: colors.background,
            flex: 1,
            height: viewportHeight,
            minHeight: 0,
          }}
        >
          <View
            className="border-b border-line bg-white/90"
            style={{ boxShadow: "0 14px 34px rgba(17, 19, 24, 0.06)" }}
          >
            <View className="w-full max-w-[680px] self-center flex-row items-center justify-between px-4 py-3">
              <Pressable
                accessibilityLabel="Close exercise detail"
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white"
                onPress={onClose}
                style={{ boxShadow: "0 10px 24px rgba(17, 19, 24, 0.08)" }}
              >
                <ChevronLeft color={colors.text} size={22} strokeWidth={2.2} />
              </Pressable>

              <View className="items-center">
                <Text className="text-[10px] font-black uppercase text-electric">
                  Exercise profile
                </Text>
                <Text className="mt-1 text-xs font-bold uppercase text-ash">
                  {exercise.targetMuscle} training
                </Text>
              </View>

              <View
                className="h-11 w-11 items-center justify-center rounded-2xl bg-electric/10"
                style={{ boxShadow: "0 10px 24px rgba(225, 29, 72, 0.08)" }}
              >
                <Dumbbell color={colors.accent} size={18} strokeWidth={2.2} />
              </View>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 104 }}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, maxHeight: viewportHeight, minHeight: 0 }}
          >
            <View className="w-full max-w-[680px] self-center">
              <Animated.View
                entering={SlideInDown.springify().damping(18)}
                style={{ paddingHorizontal: 16, paddingTop: 16 }}
              >
                <View
                  className="relative w-full overflow-hidden rounded-[32px] border border-line bg-white"
                  style={{
                    aspectRatio: 1,
                    borderCurve: "continuous",
                    boxShadow: "0 24px 44px rgba(17, 19, 24, 0.08)",
                  }}
                >
                  {canPlayVideo && displayedExercise.videoUrl ? (
                    <ExerciseVideo url={displayedExercise.videoUrl} />
                  ) : (
                    <Image
                      accessibilityLabel={`${displayedExercise.name} demonstration`}
                      fadeDuration={120}
                      resizeMode="contain"
                      source={{ uri: displayedExercise.gifUrl }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  )}
                  <View className="absolute left-3 top-3 rounded-full bg-white/94 px-3 py-2">
                    <Text className="text-[10px] font-black uppercase text-electric">
                      {canPlayVideo && displayedExercise.videoUrl ? "Coach video" : "GIF motion guide"}
                    </Text>
                  </View>
                  <View
                    className="absolute bottom-3 right-3 rounded-full bg-electric px-3 py-2"
                    style={{ boxShadow: "0 14px 28px rgba(225, 29, 72, 0.2)" }}
                  >
                    <Text className="text-[10px] font-black uppercase text-white">
                      {displayedExercise.intensity}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <View className="px-5 pb-6 pt-5">
                <Text className="text-xs font-black uppercase text-electric">
                  {displayedExercise.targetMuscle} - {displayedExercise.equipment}
                </Text>
                <Text className="mt-2 text-[38px] font-black leading-[42px] text-bone">
                  {displayedExercise.name}
                </Text>

                <View className="mt-5 gap-2">
                  <View className="flex-row gap-2">
                    <ExerciseMetric
                      icon={<ListChecks color={colors.accent} size={18} strokeWidth={2.1} />}
                      label="Sets"
                      value={String(displayedExercise.sets)}
                    />
                    <ExerciseMetric
                      icon={<Target color={colors.accent} size={18} strokeWidth={2.1} />}
                      label="Reps"
                      value={displayedExercise.reps}
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <ExerciseMetric
                      icon={<Dumbbell color={colors.accent} size={18} strokeWidth={2.1} />}
                      label="Working load"
                      value={displayedExercise.weight}
                    />
                    <ExerciseMetric
                      icon={<Clock3 color={colors.accent} size={18} strokeWidth={2.1} />}
                      label="Recovery"
                      value={`${displayedExercise.restSeconds}s`}
                    />
                  </View>
                </View>

                <Animated.View entering={FadeInDown.delay(60).duration(220)}>
                  <View
                    className="mt-5 rounded-[30px] border border-line bg-graphite p-4"
                    style={{ boxShadow: "0 20px 42px rgba(17, 19, 24, 0.08)" }}
                  >
                    <View className="mb-4">
                      <Text className="text-[10px] font-black uppercase text-electric">
                        Make it yours
                      </Text>
                      <Text className="mt-1 text-xs leading-5 text-ash">
                        Fine-tune sets, reps, load and recovery before the session starts.
                      </Text>
                    </View>
                    <View className="gap-3">
                      <DetailStepper
                        label="Sets"
                        onChange={(sets) => updateDraft({ sets })}
                        value={displayedExercise.sets}
                      />
                      <DetailStepper
                        label="Reps"
                        max={50}
                        onChange={(reps) => updateDraft({ reps: String(reps) })}
                        value={numericValue(displayedExercise.reps, 10)}
                      />
                      <DetailStepper
                        label="Working load"
                        max={300}
                        min={0}
                        onChange={(weight) => updateDraft({ weight: `${weight} kg` })}
                        step={5}
                        suffix=" kg"
                        value={numericValue(displayedExercise.weight, 0)}
                      />
                      <DetailStepper
                        label="Recovery"
                        max={300}
                        min={15}
                        onChange={(restSeconds) => updateDraft({ restSeconds })}
                        step={15}
                        suffix="s"
                        value={displayedExercise.restSeconds}
                      />
                    </View>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(120).duration(220)}>
                  <View
                    className="mt-5 overflow-hidden rounded-[28px] border border-line bg-graphite"
                    style={{ boxShadow: "0 18px 38px rgba(17, 19, 24, 0.08)" }}
                  >
                    <View className="h-1.5 bg-electric" />
                    <View className="p-4">
                      <View className="flex-row items-center gap-2">
                        <BadgeCheck color={colors.accent} size={18} strokeWidth={2} />
                        <Text className="text-xs font-black uppercase text-bone">Coach cue</Text>
                      </View>
                      <Text className="mt-3 text-base font-semibold leading-6 text-steel">
                        {displayedExercise.coachCue}
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(180).duration(220)}>
                  <View
                    className="mt-4 rounded-[28px] border border-line bg-graphite p-4"
                    style={{ boxShadow: "0 18px 38px rgba(17, 19, 24, 0.08)" }}
                  >
                    <View className="mb-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <ListChecks color={colors.accent} size={18} strokeWidth={2} />
                        <Text className="text-xs font-black uppercase text-bone">
                          Execution standard
                        </Text>
                      </View>
                      <Text className="text-xs font-black uppercase text-ash">
                        {displayedExercise.tempo} tempo
                      </Text>
                    </View>

                    {displayedExercise.instructions.map((instruction, index) => (
                      <View
                        className={`flex-row gap-3 py-3 ${
                          index < displayedExercise.instructions.length - 1
                            ? "border-b border-line"
                            : ""
                        }`}
                        key={instruction}
                      >
                        <View className="h-7 w-7 items-center justify-center rounded-full bg-electric">
                          <Text className="text-xs font-black text-white">{index + 1}</Text>
                        </View>
                        <Text className="min-w-0 flex-1 text-sm font-semibold leading-5 text-steel">
                          {instruction}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </View>
            </View>
          </ScrollView>

          <View className="border-t border-line bg-white/90 px-4 pb-4 pt-3">
            <View className="w-full max-w-[648px] self-center">
              <Pressable
                accessibilityLabel={`Start ${displayedExercise.name}`}
                accessibilityRole="button"
                className="h-16 flex-row items-center justify-center gap-3 rounded-[26px] bg-electric"
                onPress={() => onStart?.(displayedExercise)}
                style={{ boxShadow: "0 18px 32px rgba(225, 29, 72, 0.22)" }}
              >
                <CirclePlay color="#FFFFFF" fill="#FFFFFF" size={21} strokeWidth={2} />
                <Text className="text-base font-black uppercase text-white">
                  Start this exercise
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

function ExerciseVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = true;
  });
  return (
    <VideoView
      accessibilityLabel="Exercise coach video"
      allowsPictureInPicture
      contentFit="contain"
      nativeControls
      player={player}
      style={{ height: "100%", width: "100%" }}
    />
  );
}

function ExerciseMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      className="min-w-0 flex-1 rounded-[24px] border border-line bg-graphite p-3"
      style={{ boxShadow: "0 16px 30px rgba(17, 19, 24, 0.06)" }}
    >
      {icon}
      <Text className="mt-3 text-base font-black text-bone" numberOfLines={1}>
        {value}
      </Text>
      <Text className="mt-1 text-[9px] font-black uppercase text-ash" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function DetailStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 12,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <View
      className="min-h-[68px] flex-row items-center rounded-[20px] border border-line bg-carbon px-3 py-2"
      style={{ boxShadow: "0 14px 28px rgba(17, 19, 24, 0.06)" }}
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
        style={{ boxShadow: "0 10px 24px rgba(225, 29, 72, 0.2)" }}
      >
        <Plus color="#FFFFFF" size={17} />
      </Pressable>
    </View>
  );
}

function numericValue(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
