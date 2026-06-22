import { exerciseLibrary } from "../data/exerciseLibrary";
import type { Exercise, MuscleGroup } from "../types";
import { storage } from "../../../utils/storage";

type ExerciseDbItem = {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  instructions?: string[];
};

type ExerciseCatalogResult = {
  exercises: Exercise[];
  source: "remote" | "cache" | "local";
};

type ExerciseDbListResponse = {
  success: boolean;
  meta?: {
    hasNextPage?: boolean;
    nextCursor?: string;
    total?: number;
  };
  data: ExerciseDbItem[];
};

const remoteBaseUrl = "https://oss.exercisedb.dev/api/v1";
const previewProxyBaseUrl = "/api/exercisedb";
const baseUrl = process.env.EXPO_OS === "web" ? previewProxyBaseUrl : remoteBaseUrl;
const cacheKey = "apex-gym:exercise-api-cache";
const allLevels: Exercise["eligibleLevels"] = ["beginner", "intermediate", "advanced", "athlete"];

function normalizeCachedExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    secondaryMuscles: [...new Set(exercise.secondaryMuscles ?? [])].filter((muscle) => muscle !== exercise.targetMuscle),
    eligibleLevels: Array.isArray(exercise.eligibleLevels) && exercise.eligibleLevels.length
      ? exercise.eligibleLevels
      : allLevels,
  };
}

const muscleMap: Record<string, MuscleGroup> = {
  pectorals: "chest",
  chest: "chest",
  back: "back",
  lats: "back",
  "upper back": "back",
  shoulders: "shoulders",
  delts: "shoulders",
  triceps: "arms",
  biceps: "arms",
  forearms: "arms",
  abs: "core",
  waist: "core",
  obliques: "core",
  quadriceps: "quads",
  quads: "quads",
  hamstrings: "hamstrings",
  glutes: "glutes",
  calves: "calves",
};

function mapMuscle(raw: string | undefined): MuscleGroup {
  if (!raw) {
    return "chest";
  }

  const normalized = raw.toLowerCase();

  return muscleMap[normalized] ?? muscleMap[normalized.replace(/^upper |^lower /, "")] ?? "chest";
}

function mapIntensity(name: string, equipment: string): Exercise["intensity"] {
  const normalized = `${name} ${equipment}`.toLowerCase();

  if (
    normalized.includes("jump") ||
    normalized.includes("slam") ||
    normalized.includes("burpee") ||
    normalized.includes("mountain") ||
    normalized.includes("carry")
  ) {
    return "conditioning";
  }

  if (
    normalized.includes("squat") ||
    normalized.includes("deadlift") ||
    normalized.includes("press") ||
    normalized.includes("row")
  ) {
    return "strength";
  }

  return "hypertrophy";
}

function buildInstructions(primaryMuscle: MuscleGroup): string[] {
  const defaults: Record<MuscleGroup, string[]> = {
    arms: [
      "Fix your elbow path before adding speed.",
      "Keep tension on the target muscle through the full rep.",
      "Stop before body swing changes the movement.",
    ],
    back: [
      "Brace hard before the first pull.",
      "Drive with the elbows instead of shrugging.",
      "Control the lowering phase and keep the ribcage quiet.",
    ],
    calves: [
      "Pause at the top instead of bouncing through the rep.",
      "Use a full stretch under control.",
      "Keep each rep smooth and repeatable.",
    ],
    chest: [
      "Create tension before the first rep.",
      "Lower with control and press through the chest.",
      "Keep the shoulder position stable across the whole set.",
    ],
    core: [
      "Brace first, then move.",
      "Keep breathing without losing position.",
      "Reset when the trunk starts drifting.",
    ],
    glutes: [
      "Finish through the hips instead of the lower back.",
      "Pause where the glutes work hardest.",
      "Control the return instead of rushing it.",
    ],
    hamstrings: [
      "Hinge cleanly and keep the spine long.",
      "Load the back line without bouncing.",
      "End the set when tension moves away from the hamstrings.",
    ],
    quads: [
      "Own the descent and keep pressure through the whole foot.",
      "Drive up with intent while staying balanced.",
      "Keep torso and knee tracking consistent.",
    ],
    shoulders: [
      "Stack ribs over hips before the set begins.",
      "Lead with clean arm paths instead of shrugging.",
      "Lower under control and keep the neck relaxed.",
    ],
  };

  return defaults[primaryMuscle];
}

function cleanInstruction(instruction: string): string {
  return instruction.replace(/^Step:\d+\s*/i, "").trim();
}

function normalizeApiExercise(item: ExerciseDbItem, index: number): Exercise {
  const primaryMuscle = mapMuscle(item.targetMuscles[0] ?? item.bodyParts[0]);
  const equipment = item.equipments[0] ?? "Bodyweight";
  const intensity = mapIntensity(item.name, equipment);
  const defaultReps =
    intensity === "strength" ? "5-8" : intensity === "conditioning" ? "12-20" : "8-12";

  return {
    id: `api-${item.exerciseId}`,
    exerciseDbId: item.exerciseId,
    name: item.name,
    targetMuscle: primaryMuscle,
    secondaryMuscles: [...new Set(item.secondaryMuscles
      .map((muscle) => muscleMap[muscle.toLowerCase()])
      .filter((muscle): muscle is MuscleGroup => Boolean(muscle)))]
      .filter((muscle) => muscle !== primaryMuscle),
    equipment,
    sets: intensity === "strength" ? 4 : 3,
    reps: index % 3 === 0 ? defaultReps : intensity === "conditioning" ? "30s" : defaultReps,
    weight: equipment === "Bodyweight" ? "Bodyweight" : "Auto load",
    restSeconds: intensity === "strength" ? 120 : intensity === "conditioning" ? 45 : 75,
    tempo: intensity === "strength" ? "3-1-X" : intensity === "conditioning" ? "controlled" : "2-1-2",
    intensity,
    eligibleLevels: ["beginner", "intermediate", "advanced", "athlete"],
    gifUrl: item.gifUrl,
    coachCue: "Stay technical, keep the target muscle loaded, and stop before form changes.",
    instructions:
      item.instructions?.map(cleanInstruction).filter(Boolean).slice(0, 5) ??
      buildInstructions(primaryMuscle),
  };
}

function dedupeExercises(exercises: Exercise[]): Exercise[] {
  return Array.from(
    new Map(
      exercises.map((exercise) => [
        exercise.exerciseDbId || `${exercise.name}-${exercise.equipment}`,
        exercise,
      ]),
    ).values(),
  );
}

export async function searchExerciseDb(query: string): Promise<Exercise[]> {
  const url = `${baseUrl}/exercises/search?search=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ExerciseDB request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ExerciseDbListResponse;

  return payload.data.slice(0, 24).map((item, index) => normalizeApiExercise(item, index));
}

async function fetchExercisePage(after?: string): Promise<ExerciseDbListResponse> {
  const params = new URLSearchParams({ limit: "25" });

  if (after) {
    params.set("after", after);
  }

  const response = await fetch(`${baseUrl}/exercises?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`ExerciseDB request failed with status ${response.status}`);
  }

  return (await response.json()) as ExerciseDbListResponse;
}

async function loadRemoteExerciseBatch(pageCount = 8): Promise<Exercise[]> {
  const exercises: Exercise[] = [];
  let after: string | undefined;

  for (let page = 0; page < pageCount; page += 1) {
    const payload = await fetchExercisePage(after);
    exercises.push(
      ...payload.data.map((item, index) => normalizeApiExercise(item, page * 25 + index)),
    );

    if (!payload.meta?.hasNextPage || !payload.meta.nextCursor) {
      break;
    }

    after = payload.meta.nextCursor;
  }

  return exercises;
}

export async function loadExerciseCatalog(): Promise<ExerciseCatalogResult> {
  const cached = storage.get<Exercise[]>(cacheKey, []).map(normalizeCachedExercise);

  try {
    const remoteBatch = await loadRemoteExerciseBatch();
    const remote = dedupeExercises([...exerciseLibrary, ...remoteBatch])
      .filter((exercise) => exercise.gifUrl.endsWith(".gif"))
      .slice(0, 220);

    if (remote.length > exerciseLibrary.length) {
      storage.set(cacheKey, remote);
      return { exercises: remote, source: "remote" };
    }
  } catch {
    // Fall back below.
  }

  if (cached.length) {
      return { exercises: dedupeExercises(cached).map(normalizeCachedExercise), source: "cache" };
  }

  return { exercises: exerciseLibrary.map(normalizeCachedExercise), source: "local" };
}
