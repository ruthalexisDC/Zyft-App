
import { BadRequestError } from "../errors/ApiError.js";

const VALID_CATEGORIES = [
  "Strength",
  "Cardio",
  "HIIT",
  "Pilates",
  "Yoga",
  "Other",
];

const VALID_UNITS = ["kg", "lb"];

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const toOptionalNumber = (
  value,
  path,
  { min = -Infinity, max = Infinity } = {}
) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < min ||
    number > max
  ) {
    throw new BadRequestError(
      `${path} must be a valid number${
        min !== -Infinity || max !== Infinity
          ? ` between ${min === -Infinity ? "-infinity" : min} and ${
              max === Infinity ? "infinity" : max
            }`
          : ""
      }.`
    );
  }

  return number;
};

const validateOptionalString = (value, path, defaultValue) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== "string") {
    throw new BadRequestError(`${path} must be a string.`);
  }

  return value;
};

const normalizeSet = (set, path) => {
  if (!isPlainObject(set)) {
    throw new BadRequestError(
      `${path} must be an object containing set details. Received ${JSON.stringify(set)}.`
    );
  }

  const reps = toOptionalNumber(
    set.reps,
    `${path}.reps`,
    { min: 0 }
  );

  if (reps === undefined) {
    throw new BadRequestError(`${path}.reps is required.`);
  }

  const weight =
    toOptionalNumber(
      set.weight,
      `${path}.weight`,
      { min: 0 }
    ) ?? 0;

  const unit = set.unit ?? "kg";

  if (!VALID_UNITS.includes(unit)) {
    throw new BadRequestError(
      `${path}.unit must be either "kg" or "lb".`
    );
  }

  const rpe = toOptionalNumber(
    set.rpe,
    `${path}.rpe`,
    { min: 1, max: 10 }
  );

  if (
    set.isWarmup !== undefined &&
    typeof set.isWarmup !== "boolean"
  ) {
    throw new BadRequestError(
      `${path}.isWarmup must be a boolean.`
    );
  }

  return {
    reps,
    weight,
    unit,
    ...(rpe !== undefined ? { rpe } : {}),
    isWarmup: set.isWarmup ?? false,
  };
};

const normalizeExercise = (exercise, index, source) => {
  const path = `${source}.exercises[${index}]`;

  if (!isPlainObject(exercise)) {
    throw new BadRequestError(`${path} must be an object.`);
  }

  if (
    exercise.sets !== undefined &&
    !Array.isArray(exercise.sets)
  ) {
    throw new BadRequestError(`${path}.sets must be an array.`);
  }

  return {
    ...(exercise._id !== undefined
      ? { _id: exercise._id }
      : {}),
    name: validateOptionalString(
      exercise.name,
      `${path}.name`
    ),
    muscleGroup: validateOptionalString(
      exercise.muscleGroup,
      `${path}.muscleGroup`,
      ""
    ),
    sets: (exercise.sets ?? []).map((set, setIndex) =>
      normalizeSet(set, `${path}.sets[${setIndex}]`)
    ),
  };
};

export const normalizeWorkout = (
  workout,
  source = "workout"
) => {
  if (workout === undefined || workout === null) {
    return workout;
  }

  const data =
    typeof workout.toObject === "function"
      ? workout.toObject()
      : workout;

  if (!isPlainObject(data)) {
    throw new BadRequestError(`${source} must be an object.`);
  }

  if (
    data.exercises !== undefined &&
    !Array.isArray(data.exercises)
  ) {
    throw new BadRequestError(`${source}.exercises must be an array.`);
  }

  if (
    data.category !== undefined &&
    data.category !== null &&
    !VALID_CATEGORIES.includes(data.category)
  ) {
    throw new BadRequestError(`${source}.category is invalid.`);
  }

  const duration = toOptionalNumber(
    data.duration,
    `${source}.duration`
  );

  const caloriesBurned = toOptionalNumber(
    data.caloriesBurned,
    `${source}.caloriesBurned`
  );

  return {
    ...(data.workoutId !== undefined
      ? { workoutId: data.workoutId }
      : {}),
    title: validateOptionalString(
      data.title,
      `${source}.title`
    ),
    ...(data.category !== undefined
      ? { category: data.category }
      : {}),
    ...(duration !== undefined ? { duration } : {}),
    ...(caloriesBurned !== undefined
      ? { caloriesBurned }
      : {}),
    exercises: (data.exercises ?? []).map(
      (exercise, index) =>
        normalizeExercise(exercise, index, source)
    ),
    imageUrl: validateOptionalString(
      data.imageUrl,
      `${source}.imageUrl`,
      ""
    ),
  };
};
