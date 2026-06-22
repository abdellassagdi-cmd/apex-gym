import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Medal, ShieldCheck, Trophy } from "lucide-react-native";

import { colors } from "../../../theme/colors";
import type { AthleteProgress } from "../types";

type LeaderboardPreviewProps = {
  progress: AthleteProgress;
};

const badgeGradient: Record<AthleteProgress["badge"], [string, string, string]> = {
  platinum: ["#F7F7F5", "#AEB7C5", "#5F6875"],
  titanium: ["#E8EEF5", "#8D99A8", "#343A45"],
  onyx: ["#2F3033", "#151515", "#060606"],
};

export function LeaderboardPreview({ progress }: LeaderboardPreviewProps) {
  const xpProgress = Math.min(progress.xp / progress.nextLevelXp, 1);

  return (
    <View className="rounded-lg border border-line bg-graphite p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <LinearGradient
            colors={badgeGradient[progress.badge]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 44,
              width: 44,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck color={colors.background} size={22} strokeWidth={2.1} />
          </LinearGradient>
          <View>
            <Text className="text-xs font-semibold uppercase text-ash">League Status</Text>
            <Text className="mt-1 text-lg font-black text-bone">{progress.league}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-xs font-medium uppercase text-ash">Rank</Text>
          <Text className="mt-1 text-xl font-black text-electric">#{progress.rank}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-md border border-line bg-carbon p-3">
          <View className="flex-row items-center gap-2">
            <Trophy color={colors.accent} size={16} strokeWidth={1.8} />
            <Text className="text-xs font-semibold uppercase text-ash">XP</Text>
          </View>
          <Text className="mt-2 text-lg font-black text-bone">
            {progress.xp.toLocaleString()} / {progress.nextLevelXp.toLocaleString()}
          </Text>
          <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-obsidian">
            <View
              className="h-full rounded-full bg-electric"
              style={{ width: `${xpProgress * 100}%` }}
            />
          </View>
        </View>

        <View className="w-28 rounded-md border border-line bg-carbon p-3">
          <View className="flex-row items-center gap-2">
            <Medal color={colors.steel} size={16} strokeWidth={1.8} />
            <Text className="text-xs font-semibold uppercase text-ash">Streak</Text>
          </View>
          <Text className="mt-2 text-lg font-black text-bone">{progress.streakDays} days</Text>
        </View>
      </View>
    </View>
  );
}
