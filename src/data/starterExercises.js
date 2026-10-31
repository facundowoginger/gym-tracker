// Exercises loaded the first time the app opens. Users can add their own later.
export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Bicep', 'Tricep', 'Legs', 'Core', 'Full Body']

// Bump this number whenever you change the list below. On next open, the app adds any
// new starter exercises and applies muscle-group changes to existing ones.
// Your logged history is never touched.
export const STARTER_VERSION = 2

export const STARTER_EXERCISES = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { name: 'Chest Fly', muscleGroup: 'Chest' },
  { name: 'Dips', muscleGroup: 'Chest', bodyweight: true },
  { name: 'High-to-Low Flies', muscleGroup: 'Chest'},
  // Back
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Dumbbell Row', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Seated Cable Row', muscleGroup: 'Back' },
  { name: 'Pull-up', muscleGroup: 'Back', bodyweight: true },
  { name: 'Chin-up', muscleGroup: 'Back', bodyweight: true },
  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Face Pull', muscleGroup: 'Shoulders' },
  // Bicep
  { name: 'Preacher Curl', muscleGroup: 'Bicep' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Bicep' },
  { name: 'Hammer Curl', muscleGroup: 'Bicep' },
  //Tricep
  { name: 'Triceps Pushdown', muscleGroup: 'Tricep' },
  { name: 'Skull Crusher', muscleGroup: 'Tricep' },
  // Legs
  { name: 'Squat', muscleGroup: 'Legs' },
  { name: 'Leg Press', muscleGroup: 'Legs' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs' },
  { name: 'Bulgarian Split Squats', muscleGroup: 'Legs' },
  { name: 'Leg Extension', muscleGroup: 'Legs' },
  { name: 'Leg Curl', muscleGroup: 'Legs' },
  { name: 'Calf Raise', muscleGroup: 'Legs' },
  // Core
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core', bodyweight: true },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core', bodyweight: true },
  { name: 'Cable Crunch', muscleGroup: 'Core' },
  // Full Body
  { name: 'Deadlift', muscleGroup: 'Full Body' },
  { name: 'Clean', muscleGroup: 'Full Body' },
  { name: 'Hang Clean', muscleGroup: 'Full Body' },
]
