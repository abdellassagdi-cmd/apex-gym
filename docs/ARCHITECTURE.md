# Apex Gym Mobile Architecture

```text
.
├── App.tsx
├── global.css
├── src
│   ├── theme
│   │   └── colors.ts
│   └── features
│       ├── onboarding
│       │   ├── types.ts
│       │   └── domain
│       │       └── medicalSafety.ts
│       └── workouts
│           ├── types.ts
│           ├── data
│           │   └── todayWorkout.ts
│           ├── services
│           │   └── exerciseDb.ts
│           ├── components
│           │   ├── BodyGraph.tsx
│           │   ├── ExerciseCard.tsx
│           │   ├── LeaderboardPreview.tsx
│           │   └── WorkoutCalendar.tsx
│           └── screens
│               └── WorkoutPlannerScreen.tsx
```

## Expansion Modules

- `features/onboarding`: health intake, medical-condition blocker, consent gates, and physician-warning screens.
- `features/workouts`: daily planner, program builder, admin-curated plan ingestion, ExerciseDB adapter, workout session state.
- `features/nutrition`: calories, macros, hydration, and wearable/imported energy data.
- `features/gamification`: XP engine, streak integrity, leagues, leaderboard snapshots, and badge inventory.
- `features/subscription`: Pro entitlement state, paywall surfaces, billing provider integration.
- `features/admin`: curated plans, trainer-authored blocks, exercise-library moderation.
- `services`: API client, auth, database sync, cache, analytics, and remote config.
- `components/ui`: shared buttons, sheets, list rows, sliders, segmented controls, and premium icon buttons.
