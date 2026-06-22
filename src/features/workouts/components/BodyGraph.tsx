import { Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import { colors } from "../../../theme/colors";
import type { FatigueState, MuscleGroup, MuscleReadiness } from "../types";

type BodyGraphProps = {
  muscles: MuscleReadiness[];
  selectedMuscle: MuscleGroup | null;
  onSelectMuscle: (muscle: MuscleGroup) => void;
};

const stateStyle: Record<FatigueState, { fill: string; stroke: string; label: string }> = {
  recovered: { fill: "#133324", stroke: colors.signal, label: "Recovered" },
  primed: { fill: "#31370A", stroke: colors.accent, label: "Primed" },
  fatigued: { fill: "#33270A", stroke: colors.caution, label: "Fatigued" },
  overloaded: { fill: "#351416", stroke: colors.danger, label: "Limit" },
};

const muscleHitAreas: Array<{
  id: MuscleGroup;
  label: string;
  left: `${number}%`;
  top: number;
  width: `${number}%`;
  height: number;
}> = [
  { id: "chest", label: "Chest", left: "31%", top: 76, width: "38%", height: 58 },
  { id: "shoulders", label: "Shoulders", left: "15%", top: 64, width: "70%", height: 54 },
  { id: "arms", label: "Arms", left: "4%", top: 98, width: "92%", height: 112 },
  { id: "core", label: "Core", left: "36%", top: 128, width: "28%", height: 88 },
  { id: "back", label: "Back", left: "24%", top: 104, width: "52%", height: 104 },
  { id: "glutes", label: "Glutes", left: "31%", top: 212, width: "38%", height: 48 },
  { id: "quads", label: "Quads", left: "29%", top: 250, width: "42%", height: 100 },
  { id: "hamstrings", label: "Hamstrings", left: "23%", top: 252, width: "54%", height: 104 },
  { id: "calves", label: "Calves", left: "27%", top: 342, width: "46%", height: 42 },
];

function readinessFor(muscles: MuscleReadiness[], id: MuscleGroup) {
  return muscles.find((muscle) => muscle.id === id);
}

function segmentColor(
  muscles: MuscleReadiness[],
  id: MuscleGroup,
  selectedMuscle: MuscleGroup | null,
) {
  const readiness = readinessFor(muscles, id);
  const base = readiness ? stateStyle[readiness.state] : stateStyle.recovered;
  const isSelected = selectedMuscle === id;
  const isActive = readiness?.isTargetedToday || isSelected;

  return {
    fill: isActive ? base.fill : "#111111",
    stroke: isActive ? base.stroke : "#333333",
    opacity: isSelected ? 1 : isActive ? 0.94 : 0.45,
    strokeWidth: isSelected ? 2.8 : 1.35,
  };
}

export function BodyGraph({ muscles, selectedMuscle, onSelectMuscle }: BodyGraphProps) {
  const selected = selectedMuscle ? readinessFor(muscles, selectedMuscle) : muscles[0];

  return (
    <Animated.View
      entering={FadeIn.duration(420)}
      layout={LinearTransition.springify().damping(18)}
      className="rounded-lg border border-line bg-graphite p-5"
    >
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xs font-semibold uppercase text-ash">Muscle Recovery Map</Text>
          <Text className="mt-1 text-xl font-black text-bone">Today targets push output</Text>
        </View>
        <View className="rounded-md border border-line bg-carbon px-3 py-2">
          <Text className="text-[10px] font-semibold uppercase text-ash">Selected</Text>
          <Text className="mt-1 text-sm font-black text-electric">
            {selected?.label ?? "Full body"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-5">
        <View className="relative h-[330px] w-[58%] items-center">
          <Svg width="100%" height={330} viewBox="0 0 260 390">
            <Defs>
              <SvgLinearGradient id="bodyShell" x1="0" x2="1" y1="0" y2="1">
                <Stop offset="0" stopColor="#2A2A2A" />
                <Stop offset="0.52" stopColor="#111111" />
                <Stop offset="1" stopColor="#050505" />
              </SvgLinearGradient>
              <SvgLinearGradient id="innerLine" x1="0" x2="1" y1="0" y2="0">
                <Stop offset="0" stopColor="#454545" stopOpacity="0.1" />
                <Stop offset="0.5" stopColor="#F7F7F5" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#454545" stopOpacity="0.1" />
              </SvgLinearGradient>
            </Defs>

            <Ellipse cx="130" cy="198" rx="88" ry="170" fill="#070707" opacity="0.72" />
            <Circle cx="130" cy="31" r="24" fill="url(#bodyShell)" stroke="#3A3A3A" />
            <Path
              d="M110 55 C117 63 143 63 150 55 L146 78 C137 84 123 84 114 78Z"
              fill="#101010"
              stroke="#333333"
            />

            <Path
              d="M76 78 C91 61 169 61 184 78 C173 110 166 152 169 207 C154 221 106 221 91 207 C94 152 87 110 76 78Z"
              fill="url(#bodyShell)"
              stroke="#2E2E2E"
              strokeWidth="1.5"
            />

            <G>
              <Path
                d="M83 88 C97 74 121 75 128 95 L128 129 C105 129 90 117 78 102 C79 96 81 91 83 88Z"
                {...segmentColor(muscles, "chest", selectedMuscle)}
              />
              <Path
                d="M177 88 C163 74 139 75 132 95 L132 129 C155 129 170 117 182 102 C181 96 179 91 177 88Z"
                {...segmentColor(muscles, "chest", selectedMuscle)}
              />
              <Line x1="130" y1="88" x2="130" y2="130" stroke="url(#innerLine)" strokeWidth="2" />
              <Path d="M89 101 C105 111 116 116 127 116" stroke="#F7F7F5" strokeOpacity="0.18" />
              <Path d="M171 101 C155 111 144 116 133 116" stroke="#F7F7F5" strokeOpacity="0.18" />
            </G>

            <G>
              <Ellipse
                cx="73"
                cy="88"
                rx="23"
                ry="19"
                {...segmentColor(muscles, "shoulders", selectedMuscle)}
              />
              <Ellipse
                cx="187"
                cy="88"
                rx="23"
                ry="19"
                {...segmentColor(muscles, "shoulders", selectedMuscle)}
              />
            </G>

            <G>
              <Path
                d="M58 105 C43 137 38 177 43 218 C49 226 61 224 65 215 C65 178 70 145 81 110Z"
                {...segmentColor(muscles, "arms", selectedMuscle)}
              />
              <Path
                d="M202 105 C217 137 222 177 217 218 C211 226 199 224 195 215 C195 178 190 145 179 110Z"
                {...segmentColor(muscles, "arms", selectedMuscle)}
              />
              <Path d="M53 134 C60 147 62 185 57 211" stroke="#F7F7F5" strokeOpacity="0.16" />
              <Path d="M207 134 C200 147 198 185 203 211" stroke="#F7F7F5" strokeOpacity="0.16" />
            </G>

            <G>
              <Path
                d="M95 134 C103 128 118 130 126 139 L125 161 C116 166 104 166 96 160Z"
                {...segmentColor(muscles, "core", selectedMuscle)}
              />
              <Path
                d="M134 139 C142 130 157 128 165 134 L164 160 C156 166 144 166 135 161Z"
                {...segmentColor(muscles, "core", selectedMuscle)}
              />
              <Rect
                x="101"
                y="166"
                width="25"
                height="20"
                rx="7"
                {...segmentColor(muscles, "core", selectedMuscle)}
              />
              <Rect
                x="134"
                y="166"
                width="25"
                height="20"
                rx="7"
                {...segmentColor(muscles, "core", selectedMuscle)}
              />
              <Rect
                x="104"
                y="191"
                width="22"
                height="19"
                rx="7"
                {...segmentColor(muscles, "core", selectedMuscle)}
              />
              <Rect
                x="134"
                y="191"
                width="22"
                height="19"
                rx="7"
                {...segmentColor(muscles, "core", selectedMuscle)}
              />
            </G>

            <G>
              <Path
                d="M87 111 C94 141 95 174 90 205 L75 195 C75 161 75 130 80 111Z"
                {...segmentColor(muscles, "back", selectedMuscle)}
              />
              <Path
                d="M173 111 C166 141 165 174 170 205 L185 195 C185 161 185 130 180 111Z"
                {...segmentColor(muscles, "back", selectedMuscle)}
              />
            </G>

            <G>
              <Path
                d="M94 214 C109 205 124 206 130 222 C122 237 106 242 91 235Z"
                {...segmentColor(muscles, "glutes", selectedMuscle)}
              />
              <Path
                d="M166 214 C151 205 136 206 130 222 C138 237 154 242 169 235Z"
                {...segmentColor(muscles, "glutes", selectedMuscle)}
              />
            </G>

            <G>
              <Path
                d="M92 241 C84 284 84 323 91 359 C101 363 111 360 116 352 C115 317 118 281 128 245Z"
                {...segmentColor(muscles, "quads", selectedMuscle)}
              />
              <Path
                d="M168 241 C176 284 176 323 169 359 C159 363 149 360 144 352 C145 317 142 281 132 245Z"
                {...segmentColor(muscles, "quads", selectedMuscle)}
              />
              <Line x1="107" y1="260" x2="105" y2="346" stroke="#F7F7F5" strokeOpacity="0.14" />
              <Line x1="153" y1="260" x2="155" y2="346" stroke="#F7F7F5" strokeOpacity="0.14" />
            </G>

            <G>
              <Path
                d="M79 246 C71 288 73 327 82 361 C88 365 93 364 96 358 C88 319 88 283 96 243Z"
                {...segmentColor(muscles, "hamstrings", selectedMuscle)}
              />
              <Path
                d="M181 243 C189 283 189 319 181 358 C184 364 190 365 195 361 C204 327 199 288 191 246Z"
                {...segmentColor(muscles, "hamstrings", selectedMuscle)}
              />
            </G>

            <G>
              <Path
                d="M86 357 C82 371 83 382 88 387 L113 387 C116 374 114 363 108 353Z"
                {...segmentColor(muscles, "calves", selectedMuscle)}
              />
              <Path
                d="M152 353 C146 363 144 374 147 387 L172 387 C177 382 178 371 174 357Z"
                {...segmentColor(muscles, "calves", selectedMuscle)}
              />
            </G>
          </Svg>

          {muscleHitAreas.map((area) => (
            <Pressable
              accessibilityLabel={`Select ${area.label}`}
              accessibilityRole="button"
              key={area.id}
              onPress={() => onSelectMuscle(area.id)}
              style={{
                height: area.height,
                left: area.left,
                opacity: 0,
                position: "absolute",
                top: area.top,
                width: area.width,
              }}
            />
          ))}
        </View>

        <View className="flex-1 gap-3">
          {muscles.slice(0, 5).map((muscle) => {
            const style = stateStyle[muscle.state];

            return (
              <View key={muscle.id}>
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-bone">{muscle.label}</Text>
                  <Text className="text-[10px] font-medium text-ash">
                    {muscle.recoveryPercent}%
                  </Text>
                </View>
                <View className="h-1.5 overflow-hidden rounded-full bg-carbon">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${muscle.recoveryPercent}%`,
                      backgroundColor: style.stroke,
                    }}
                  />
                </View>
                <Text className="mt-1 text-[10px] uppercase text-ash">{style.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}
