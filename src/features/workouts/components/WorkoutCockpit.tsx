import { Pressable, Text, View } from "react-native";
import { ArrowUpRight, BadgeCheck, Plus, Utensils } from "lucide-react-native";

import { colors } from "../../../theme/colors";

type WorkoutCockpitProps = {
  onOpenBuilder: () => void;
};

export function WorkoutCockpit({ onOpenBuilder }: WorkoutCockpitProps) {
  return (
    <View className="mt-6 px-5">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-black uppercase text-ash">Control Center</Text>
        <Text className="text-xs font-semibold uppercase text-electric">Pro Active</Text>
      </View>

      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onOpenBuilder}
          className="rounded-lg border border-line bg-graphite p-4 active:border-electric"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-md bg-electric">
                <Plus color={colors.background} size={20} strokeWidth={2.2} />
              </View>
              <View>
                <Text className="text-sm font-black text-bone">Program Builder</Text>
                <Text className="mt-1 text-xs font-medium uppercase text-ash">
                  142 library movements
                </Text>
              </View>
            </View>
            <ArrowUpRight color={colors.steel} size={17} strokeWidth={1.9} />
          </View>
        </Pressable>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-lg border border-line bg-graphite p-4">
            <View className="mb-3 flex-row items-center gap-2">
              <Utensils color={colors.accent} size={17} strokeWidth={1.9} />
              <Text className="text-xs font-black uppercase text-ash">Macros</Text>
            </View>
            <Text className="text-sm font-black text-bone">Manual targets</Text>
            <Text className="mt-1 text-xs uppercase text-ash">set in profile</Text>
          </View>

          <View className="flex-1 rounded-lg border border-line bg-graphite p-4">
            <Text className="text-xs font-black uppercase text-ash">Recovery</Text>
            <Text className="mt-3 text-sm font-black text-bone">No device data</Text>
            <Text className="mt-1 text-xs uppercase text-ash">score hidden</Text>
          </View>
        </View>

        <View className="rounded-lg border border-line bg-graphite p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <BadgeCheck color={colors.accent} size={17} strokeWidth={1.9} />
              <Text className="text-xs font-black uppercase text-ash">Admin Plan</Text>
            </View>
            <Text className="text-xs font-black uppercase text-electric">Synced</Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-carbon">
            <View className="h-full w-[68%] rounded-full bg-electric" />
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm font-black text-bone">Upper Power Architecture</Text>
            <Text className="text-xs font-semibold uppercase text-ash">Week 3 / 6</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
