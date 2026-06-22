import { ImageBackground, Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  ShieldCheck,
  X,
} from "lucide-react-native";

import { colors } from "../../../theme/colors";
import type { TrainingProgram, TrainingWeekday } from "../data/workoutCatalog";

const weekdayLabels: Record<TrainingWeekday, string> = {
  1: "Sunday",
  2: "Monday",
  3: "Tuesday",
  4: "Wednesday",
  5: "Thursday",
  6: "Friday",
  7: "Saturday",
};

type ProgramDetailSheetProps = {
  program: TrainingProgram | null;
  onClose: () => void;
  onStart: (program: TrainingProgram) => void;
};

export function ProgramDetailSheet({
  program,
  onClose,
  onStart,
}: ProgramDetailSheetProps) {
  if (!program) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={Boolean(program)}
    >
      <SafeAreaView className="flex-1 bg-[#F7F8FC]">
        <Animated.View
          entering={FadeIn.duration(180)}
          className="flex-1 bg-[#F7F8FC]"
          style={{ backgroundColor: colors.background, flex: 1, minHeight: 0 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 112 }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full max-w-[680px] self-center">
          <ImageBackground
            source={{ uri: program.imageUrl }}
                className="h-[430px] justify-between overflow-hidden"
            resizeMode="cover"
          >
                <View className="absolute inset-0 bg-electric/55" />
            <View className="flex-row items-center justify-between p-5">
              <View className="rounded-full bg-white/90 px-3 py-2">
                    <Text className="text-[10px] font-black uppercase text-electric">
                  {program.adminCurated ? "Apex Coach Plan" : "Training Program"}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close program details"
                accessibilityRole="button"
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
              >
                <X color={colors.text} size={19} strokeWidth={2} />
              </Pressable>
            </View>

            <View className="p-5">
                  <Text className="text-[40px] font-black leading-[44px] text-white">
                    {program.title}
                  </Text>
              <Text className="mt-2 max-w-[90%] text-sm font-semibold leading-5 text-white/80">
                {program.subtitle}
              </Text>
            </View>
          </ImageBackground>

          <View className="gap-5 px-5 pt-5">
            <View className="flex-row gap-2">
              <ProgramMetric
                icon={<CalendarDays color={colors.accent} size={17} />}
                label={`${program.durationWeeks} weeks`}
              />
              <ProgramMetric
                icon={<Clock3 color={colors.accent} size={17} />}
                label={`${program.schedule.length} days/week`}
              />
              <ProgramMetric
                icon={<Dumbbell color={colors.accent} size={17} />}
                label={program.level}
              />
            </View>

            <View>
              <Text className="text-xl font-black text-bone">Program structure</Text>
              <Text className="mt-1 text-sm leading-5 text-ash">
                {program.sessionsPerWeek} separate training days. Each day keeps its own exercise
                list.
              </Text>
              <View className="mt-4 gap-2">
                {program.schedule.map((day, index) => (
                  <View
                    className="flex-row items-center gap-3 border-b border-line py-3"
                    key={day.weekday}
                  >
                    <View className="h-8 w-8 items-center justify-center rounded-md bg-electric">
                      {index === 0 ? (
                        <Check color={colors.background} size={17} strokeWidth={3} />
                      ) : (
                        <Text className="font-black text-obsidian">{index + 1}</Text>
                      )}
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-black text-bone">{day.label}</Text>
                      <Text className="mt-1 text-xs text-ash">
                        {weekdayLabels[day.weekday]} - {day.exercises.length} exercises
                      </Text>
                    </View>
                    <ChevronRight color={colors.muted} size={18} />
                  </View>
                ))}
              </View>
            </View>

            <View className="rounded-lg border border-line bg-graphite p-4">
              <View className="flex-row items-center gap-2">
                <ShieldCheck color={colors.steel} size={18} />
                <Text className="text-xs font-black uppercase text-steel">Recovery data</Text>
              </View>
              <Text className="mt-2 text-sm leading-5 text-steel">
                No automatic recovery adjustment is applied without connected wearable data.
                Change sets, reps or load manually before starting.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => onStart(program)}
                  className="h-16 items-center justify-center rounded-[22px] bg-electric"
            >
                  <Text className="text-sm font-black uppercase text-white">Start this program</Text>
            </Pressable>
          </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

function ProgramMetric({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-lg border border-line bg-graphite p-3">
      {icon}
      <Text className="mt-2 text-xs font-black text-steel" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
