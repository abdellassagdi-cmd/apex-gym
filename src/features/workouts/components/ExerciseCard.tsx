import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  BicepsFlexed,
  ChevronRight,
  Dumbbell,
  Flame,
  Target,
  Timer,
  Weight,
  Zap,
} from "lucide-react-native";

import { colors } from "../../../theme/colors";
import type { Exercise, MuscleGroup } from "../types";

type ExerciseCardProps = {
  exercise: Exercise;
  index: number;
  isFocused: boolean;
  onPress: (exercise: Exercise) => void;
};

type IconProps = {
  color: string;
  size: number;
  strokeWidth?: number;
};

const muscleIcon: Record<MuscleGroup, React.ComponentType<IconProps>> = {
  chest: Target,
  back: Activity,
  shoulders: Zap,
  arms: BicepsFlexed,
  core: Flame,
  quads: Dumbbell,
  hamstrings: Dumbbell,
  glutes: Dumbbell,
  calves: Dumbbell,
};

export function ExerciseCard({ exercise, index, isFocused, onPress }: ExerciseCardProps) {
  const MuscleIcon = muscleIcon[exercise.targetMuscle];

  return (
    <Animated.View
      entering={FadeInUp.delay(90 + index * 65).springify().damping(17)}
      layout={LinearTransition.springify().damping(18)}
    >
      <Pressable
        accessibilityLabel={`Open ${exercise.name}`}
        accessibilityRole="button"
        onPress={() => onPress(exercise)}
        className={`overflow-hidden rounded-lg border ${
          isFocused ? "border-electric" : "border-line"
        } bg-graphite active:border-electric/50`}
        style={{
          borderCurve: "continuous",
          boxShadow: isFocused
            ? "0 22px 44px rgba(225, 29, 72, 0.16)"
            : "0 18px 40px rgba(17, 19, 24, 0.08)",
        }}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.96)", "rgba(255,241,243,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View className="flex-row">
          <View className="min-h-[136px] w-28 self-stretch overflow-hidden bg-carbon">
            <Image
              source={{ uri: exercise.gifUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              fadeDuration={120}
            />
            <View className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1">
              <Text className="text-[10px] font-black uppercase text-electric">Motion</Text>
            </View>
          </View>

          <View className="min-w-0 flex-1 p-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <View className="mb-2 flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-xl border border-electric/10 bg-electric/5">
                    <MuscleIcon color={colors.accent} size={15} strokeWidth={1.9} />
                  </View>
                  <Text className="text-xs font-semibold uppercase text-ash">
                    {exercise.targetMuscle}
                  </Text>
                </View>
                <Text className="text-base font-black text-bone" numberOfLines={2}>
                  {exercise.name}
                </Text>
              </View>
              <ChevronRight color={colors.muted} size={18} strokeWidth={1.8} />
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              <View className="rounded-full border border-electric/10 bg-white px-2.5 py-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Dumbbell color={colors.steel} size={13} strokeWidth={1.8} />
                  <Text className="text-[11px] font-semibold text-steel">
                    {exercise.sets} x {exercise.reps}
                  </Text>
                </View>
              </View>
              <View className="rounded-full border border-electric/10 bg-white px-2.5 py-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Weight color={colors.steel} size={13} strokeWidth={1.8} />
                  <Text className="text-[11px] font-semibold text-steel">{exercise.weight}</Text>
                </View>
              </View>
              <View className="rounded-full border border-electric/10 bg-white px-2.5 py-1.5">
                <View className="flex-row items-center gap-1.5">
                  <Timer color={colors.steel} size={13} strokeWidth={1.8} />
                  <Text className="text-[11px] font-semibold text-steel">
                    {exercise.restSeconds}s
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-xs font-medium uppercase text-ash">{exercise.tempo} tempo</Text>
              <View className="rounded-full bg-electric/8 px-2.5 py-1">
                <Text className="text-[11px] font-black text-electric">
                  {exercise.intensity}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
