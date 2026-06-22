import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import {
  Dumbbell,
  House,
  PanelsTopLeft,
  UserRound,
} from "lucide-react-native";

import { colors } from "../../../theme/colors";

export type AppDockTab = "today" | "programs" | "exercises" | "profile";

type AppDockProps = {
  activeTab: AppDockTab;
  onSelectTab: (tab: AppDockTab) => void;
};

const tabs: Array<{
  id: AppDockTab;
  label: string;
  icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
}> = [
  { id: "today", label: "Home", icon: House },
  { id: "programs", label: "Programs", icon: PanelsTopLeft },
  { id: "exercises", label: "Exercises", icon: Dumbbell },
  { id: "profile", label: "Profile", icon: UserRound },
];

const dockShellStyle =
  process.env.EXPO_OS === "web"
    ? ({
        bottom: 0,
        left: 0,
        position: "fixed",
        right: 0,
        width: "100vw",
        zIndex: 1000,
      } as unknown as ViewStyle)
    : ({
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        zIndex: 1000,
      } as ViewStyle);

export function AppDock({ activeTab, onSelectTab }: AppDockProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      layout={LinearTransition.springify().damping(18)}
      className="border-t border-line/60 bg-white px-3 pb-2 pt-1"
      style={dockShellStyle}
    >
      <BlurView
        intensity={34}
        tint="light"
        className="overflow-hidden rounded-[24px] border border-white/70 bg-white/90"
        style={{ borderRadius: 24, boxShadow: "0 -10px 28px rgba(17, 19, 24, 0.08)", overflow: "hidden" }}
      >
        <View className="flex-row items-center justify-between px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Pressable
              accessibilityLabel={`Open ${tab.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              className="h-12 flex-1 items-center justify-center"
              style={{ borderRadius: 24, overflow: "hidden" }}
            >
              {isActive ? (
                <LinearGradient
                  colors={["#FFF5F6", "#FFE2E8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderColor: "rgba(225, 29, 72, 0.12)",
                    borderRadius: 24,
                    borderWidth: 1,
                    bottom: 2,
                    left: 4,
                    position: "absolute",
                    right: 4,
                    top: 2,
                  }}
                />
              ) : null}
              <Icon
                color={isActive ? colors.accent : colors.muted}
                size={18}
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              <Text
                className={`mt-1 text-[10px] font-black ${
                  isActive ? "text-electric" : "text-ash"
                }`}
              >
                {tab.label}
              </Text>
              {isActive ? <View className="mt-0.5 h-1 w-6 rounded-full bg-electric" /> : null}
            </Pressable>
          );
        })}
        </View>
      </BlurView>
    </Animated.View>
  );
}
