import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { CalendarDays } from "lucide-react-native";

import { colors } from "../../../theme/colors";
import type { WorkoutDay } from "../types";

type WorkoutCalendarProps = {
  days: WorkoutDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

export function WorkoutCalendar({
  days,
  selectedDate,
  onSelectDate,
}: WorkoutCalendarProps) {
  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between px-5">
        <View className="flex-row items-center gap-2">
          <CalendarDays color={colors.steel} size={18} strokeWidth={1.8} />
          <Text className="text-sm font-semibold uppercase text-steel">Training Calendar</Text>
        </View>
        <Text className="text-xs font-medium uppercase text-ash">7 day load</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-5"
      >
        {days.map((day, index) => {
          const isSelected = day.date === selectedDate;

          return (
            <Animated.View
              entering={FadeInDown.delay(index * 45).springify().damping(16)}
              key={day.date}
              layout={LinearTransition.springify().damping(18)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelectDate(day.date)}
                className={`h-24 w-20 justify-between rounded-lg border p-3 ${
                  isSelected
                    ? "border-electric bg-electric"
                    : "border-line bg-graphite active:border-steel"
                }`}
              >
                <View>
                  <Text
                    className={`text-[11px] font-semibold ${
                      isSelected ? "text-obsidian" : "text-ash"
                    }`}
                  >
                    {day.dayLabel}
                  </Text>
                  <Text
                    className={`mt-1 text-2xl font-black ${
                      isSelected ? "text-obsidian" : "text-bone"
                    }`}
                  >
                    {day.dayNumber}
                  </Text>
                </View>
                <View>
                  <Text
                    className={`text-[10px] font-semibold uppercase ${
                      isSelected ? "text-obsidian" : "text-steel"
                    }`}
                    numberOfLines={1}
                  >
                    {day.focus}
                  </Text>
                  <Text
                    className={`mt-1 text-[10px] ${
                      isSelected ? "text-obsidian/70" : "text-ash"
                    }`}
                  >
                    Planned day
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}
