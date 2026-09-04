const GOALS = new Set([
    "LOSE_WEIGHT",
    "MAINTAIN",
    "GAIN_MUSCLE",
    "GENERAL_FITNESS",
]);

const DIETS = new Set([
    "VEGETARIAN",
    "EGGETARIAN",
    "NON_VEGETARIAN",
    "VEGAN",
]);

const ACTIVITIES = new Set(["LOW", "LIGHT", "MODERATE", "HIGH"]);
const BUDGETS = new Set(["ECONOMY", "BALANCED", "FLEXIBLE"]);
const CUISINE_STYLES = new Set([
    "ANY",
    "NORTH_INDIAN",
    "SOUTH_INDIAN",
    "PUNJABI",
    "GUJARATI",
    "BENGALI",
    "MAHARASHTRIAN",
]);
const COOKING_STYLES = new Set(["FLEXIBLE", "QUICK_15_MIN", "MEAL_PREP", "MINIMAL_COOKING"]);
const WORKOUT_TIMES = new Set(["NOT_SCHEDULED", "MORNING", "AFTERNOON", "EVENING"]);
const WORKOUT_DAYS = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
const HEALTH_CONCERNS = new Set([
    "THYROID",
    "PCOS",
    "DIABETES",
    "HIGH_BLOOD_PRESSURE",
    "HIGH_CHOLESTEROL",
    "KIDNEY_DISEASE",
    "HEART_DISEASE",
    "LIVER_DISEASE",
    "PREGNANCY_POSTPARTUM",
    "EATING_DISORDER",
    "FOOD_ALLERGY",
    "OTHER_MEDICAL_CONDITION",
]);

const MEDICAL_KEYWORDS = /thyroid|diabet|pcos|pregnan|kidney|renal|heart|cholesterol|blood pressure|hypertension|allerg|eating disorder|medication|medicine/i;

const activityMultipliers = {
    LOW: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    HIGH: 1.725,
};

const goalDetails = {
    LOSE_WEIGHT: {
        label: "Weight loss",
        adjustment: -300,
        proteinPerKg: 1.4,
        message: "A measured calorie reduction supports gradual, sustainable progress.",
    },
    MAINTAIN: {
        label: "Maintenance",
        adjustment: 0,
        proteinPerKg: 1.2,
        message: "Your plan is balanced around maintaining your present routine and energy needs.",
    },
    GAIN_MUSCLE: {
        label: "Muscle gain",
        adjustment: 250,
        proteinPerKg: 1.6,
        message: "A small calorie surplus and higher protein target support strength training progress.",
    },
    GENERAL_FITNESS: {
        label: "General fitness",
        adjustment: 0,
        proteinPerKg: 1.2,
        message: "Your plan prioritises steady energy, protein, and everyday consistency.",
    },
};

const mealSplits = {
    3: [
        ["Breakfast", 0.3],
        ["Lunch", 0.4],
        ["Dinner", 0.3],
    ],
    4: [
        ["Breakfast", 0.25],
        ["Lunch", 0.35],
        ["Snack", 0.15],
        ["Dinner", 0.25],
    ],
    5: [
        ["Breakfast", 0.22],
        ["Lunch", 0.32],
        ["Morning snack", 0.1],
        ["Evening snack", 0.12],
        ["Dinner", 0.24],
    ],
};

const roundToNearest = (value, step = 5) => Math.round(value / step) * step;

const createError = (message, status = 400, code) => {
    const error = new Error(message);
    error.status = status;
    if (code) error.code = code;
    return error;
};

const readNumber = (value, label, min, max) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw createError(`${label} must be between ${min} and ${max}.`);
    }
    return number;
};

const normaliseConcerns = (value) => {
    if (!Array.isArray(value)) return [];

    const concerns = [...new Set(value.map((item) => String(item || "").trim()))]
        .filter((item) => HEALTH_CONCERNS.has(item));

    if (concerns.length !== value.length || concerns.length > 4) {
        throw createError("Choose up to four valid health considerations.");
    }

    return concerns;
};

const normaliseWorkoutDays = (value) => {
    if (!Array.isArray(value)) return [];

    const days = [...new Set(value.map((item) => String(item || "").trim()))]
        .filter((item) => WORKOUT_DAYS.has(item));

    if (days.length !== value.length) {
        throw createError("Choose only valid workout days.");
    }

    return days;
};

const readShortText = (value, maxLength = 100) => String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const validateInput = (input = {}) => {
    const goal = String(input.goal || "").trim();
    const diet = String(input.diet || "").trim();
    const activityLevel = String(input.activityLevel || "").trim();
    const budget = String(input.budget || "BALANCED").trim();
    const cuisineStyle = String(input.cuisineStyle || "ANY").trim();
    const cookingStyle = String(input.cookingStyle || "FLEXIBLE").trim();
    const workoutTime = String(input.workoutTime || "NOT_SCHEDULED").trim();
    const mealsPerDay = Number(input.mealsPerDay || 4);
    const sex = ["MALE", "FEMALE", "UNSPECIFIED"].includes(input.sex)
        ? input.sex
        : "UNSPECIFIED";

    if (!GOALS.has(goal)) throw createError("Choose a fitness goal.");
    if (!DIETS.has(diet)) throw createError("Choose a dietary preference.");
    if (!ACTIVITIES.has(activityLevel)) throw createError("Choose an activity level.");
    if (!BUDGETS.has(budget)) throw createError("Choose a budget preference.");
    if (!CUISINE_STYLES.has(cuisineStyle)) throw createError("Choose a cuisine preference.");
    if (!COOKING_STYLES.has(cookingStyle)) throw createError("Choose a cooking preference.");
    if (!WORKOUT_TIMES.has(workoutTime)) throw createError("Choose a workout time.");
    if (![3, 4, 5].includes(mealsPerDay)) {
        throw createError("Meals per day must be 3, 4, or 5.");
    }
    if (input.aiConsent !== true) {
        throw createError("Confirm that FitSwap may send these plan preferences to its AI service to generate your diet plan.");
    }

    const dietaryNotes = readShortText(input.dietaryNotes, 180);
    const weeklyBudgetInr = input.weeklyBudgetInr === "" || input.weeklyBudgetInr === null || input.weeklyBudgetInr === undefined
        ? null
        : readNumber(input.weeklyBudgetInr, "Weekly budget", 250, 100000);

    return {
        age: readNumber(input.age, "Age", 18, 85),
        heightCm: readNumber(input.heightCm, "Height", 130, 230),
        weightKg: readNumber(input.weightKg, "Weight", 35, 250),
        sex,
        goal,
        diet,
        activityLevel,
        mealsPerDay,
        budget,
        cuisineStyle,
        cookingStyle,
        workoutTime,
        workoutDays: normaliseWorkoutDays(input.workoutDays),
        weeklyBudgetInr,
        dietaryNotes,
        favouriteFoods: readShortText(input.favouriteFoods),
        avoidFoods: readShortText(input.avoidFoods),
        healthConcerns: normaliseConcerns(input.healthConcerns),
    };
};

const calculateBmr = ({ weightKg, heightCm, age, sex }) => {
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    if (sex === "MALE") return base + 5;
    if (sex === "FEMALE") return base - 161;
    return base - 78;
};

const createMealStructure = ({ mealsPerDay, calories }) => {
    const splits = mealSplits[mealsPerDay];

    return Array.from({ length: 7 }, (_, index) => ({
        day: index + 1,
        label: `Day ${index + 1}`,
        meals: splits.map(([label, share]) => ({
            label,
            targetCalories: Math.round((calories * share) / 10) * 10,
        })),
    }));
};

const createBasePlan = (input) => {
    const goal = goalDetails[input.goal];
    const estimatedMaintenanceCalories = Math.round(
        calculateBmr(input) * activityMultipliers[input.activityLevel]
    );
    const lowerSafetyLimit = input.sex === "MALE" ? 1500 : 1200;
    const targetCalories = Math.max(
        lowerSafetyLimit,
        Math.round(estimatedMaintenanceCalories + goal.adjustment)
    );
    const proteinGrams = Math.min(190, Math.max(50, roundToNearest(input.weightKg * goal.proteinPerKg)));
    const fatGrams = Math.min(95, Math.max(40, roundToNearest((targetCalories * 0.27) / 9)));
    const carbohydrateGrams = Math.max(
        80,
        roundToNearest((targetCalories - ((proteinGrams * 4) + (fatGrams * 9))) / 4)
    );

    return {
        profile: {
            goal: input.goal,
            goalLabel: goal.label,
            diet: input.diet,
            activityLevel: input.activityLevel,
            mealsPerDay: input.mealsPerDay,
            budget: input.budget,
            cuisineStyle: input.cuisineStyle,
            cookingStyle: input.cookingStyle,
            workoutTime: input.workoutTime,
            workoutDays: input.workoutDays,
            weeklyBudgetInr: input.weeklyBudgetInr,
        },
        dailyTargets: {
            calories: targetCalories,
            calorieRange: {
                min: Math.max(lowerSafetyLimit, targetCalories - 100),
                max: targetCalories + 100,
            },
            proteinGrams,
            carbohydrateGrams,
            fatGrams,
            estimatedMaintenanceCalories,
        },
        mealStructure: createMealStructure({
            mealsPerDay: input.mealsPerDay,
            calories: targetCalories,
        }),
        goalMessage: goal.message,
    };
};

const needsProfessionalReview = (input) => (
    input.healthConcerns.length > 0
    || MEDICAL_KEYWORDS.test(`${input.dietaryNotes} ${input.avoidFoods}`)
);

const buildProfessionalReviewResponse = (input, basePlan) => ({
    model: "FitSwap Health Safety Gate",
    generationMethod: "professional-review-required",
    requiresProfessionalReview: true,
    profile: basePlan.profile,
    dailyTargets: basePlan.dailyTargets,
    healthConcerns: input.healthConcerns,
    warnings: [
        "FitSwap cannot safely generate a disease-specific or allergy-safe diet plan.",
        "Please share these general targets and preferences with a qualified doctor or registered dietitian, who can consider diagnoses, test results, medicines, and allergies.",
        "Do not use an automated diet plan to replace medical treatment or nutrition therapy.",
    ],
});

const getGroqConfig = () => {
    const apiKey = String(process.env.GROQ_API_KEY || "").trim();
    if (!apiKey) {
        throw createError(
            "The AI diet service is not configured yet. Please try again later.",
            503,
            "GROQ_NOT_CONFIGURED"
        );
    }

    return {
        apiKey,
        // This model supports Groq's strict Structured Outputs mode.
        model: String(process.env.GROQ_MODEL || "openai/gpt-oss-20b").trim(),
    };
};

const cleanText = (value, maxLength = 320) => String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const parseGroqJson = (responseBody) => {
    const text = String(responseBody?.choices?.[0]?.message?.content || "").trim();

    if (!text) {
        throw createError("Did not return a usable diet plan. Please try again.", 502, "GROQ_EMPTY_RESPONSE");
    }

    try {
        return JSON.parse(text);
    } catch {
        throw createError("Did not return a valid diet plan. Please try again.", 502, "GROQ_INVALID_RESPONSE");
    }
};

const normaliseWeeklyPlan = (aiPlan, mealStructure) => {
    if (!Array.isArray(aiPlan) || aiPlan.length !== 7) {
        throw createError("Did not return a complete weekly plan. Please try again.", 502, "GROQ_INVALID_PLAN");
    }

    return mealStructure.map((day, dayIndex) => {
        const generatedDay = aiPlan[dayIndex];
        if (!Array.isArray(generatedDay?.meals) || generatedDay.meals.length !== day.meals.length) {
            throw createError("Did not return a complete daily meal plan. Please try again.", 502, "GROQ_INVALID_PLAN");
        }

        return {
            ...day,
            meals: day.meals.map((meal, mealIndex) => {
                const suggestion = cleanText(generatedDay.meals[mealIndex]?.suggestion, 280);
                if (!suggestion) {
                    throw createError("Did not return a meal suggestion. Please try again.", 502, "GROQ_INVALID_PLAN");
                }
                return { ...meal, suggestion };
            }),
        };
    });
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const dietPlanSchema = {
    type: "object",
    additionalProperties: false,
    required: ["headline", "summary", "weeklyPlan", "groceryList", "budgetTips", "mealTiming", "preparationTip"],
    properties: {
        headline: { type: "string" },
        summary: { type: "string" },
        weeklyPlan: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["day", "meals"],
                properties: {
                    day: { type: "integer" },
                    meals: {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            required: ["suggestion"],
                            properties: { suggestion: { type: "string" } },
                        },
                    },
                },
            },
        },
        groceryList: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["category", "items"],
                properties: {
                    category: { type: "string" },
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            required: ["name", "quantity"],
                            properties: {
                                name: { type: "string" },
                                quantity: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
        budgetTips: { type: "array", items: { type: "string" } },
        mealTiming: { type: "string" },
        preparationTip: { type: "string" },
    },
};

const mealSwapSchema = {
    type: "object",
    additionalProperties: false,
    required: ["suggestion", "note"],
    properties: {
        suggestion: { type: "string" },
        note: { type: "string" },
    },
};

const requestGroqJson = async ({ apiKey, model, prompt, schema, schemaName, maxTokens, attempt = 0 }) => {
    let response;
    try {
        response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.55,
                    max_tokens: maxTokens,
                    response_format: {
                        type: "json_schema",
                        json_schema: {
                            name: schemaName,
                            strict: true,
                            schema,
                        },
                    },
                }),
                signal: AbortSignal.timeout(30000),
            }
        );
    } catch (error) {
        // Keep the operational detail in the server logs, but never expose an
        // API key, request headers, or the full prompt to the browser.
        console.error("Groq diet planner connection failed", {
            name: error?.name,
            message: error?.message,
            code: error?.cause?.code,
        });

        if (error.name === "TimeoutError") {
            throw createError("Took too long to respond. Please try again.", 504, "GROQ_TIMEOUT");
        }
        if (error?.cause?.code === "ENOTFOUND") {
            throw createError("The AI service could not be reached. Please try again.", 502, "GROQ_NETWORK_DNS");
        }
        throw createError("FitSwap could not reach the AI service. Please try again.", 502, "GROQ_UNAVAILABLE");
    }

    let responseBody;
    try {
        responseBody = await response.json();
    } catch {
        throw createError("Did not return a readable response. Please try again.", 502, "GROQ_INVALID_RESPONSE");
    }

    if (!response.ok) {
        console.error("Groq diet planner request failed", { status: response.status, body: responseBody?.error?.message });
        if (response.status === 401 || response.status === 403) {
            throw createError("The AI service is unavailable right now. Please try again later.", 502, "GROQ_AUTH_FAILED");
        }
        if (response.status === 404) {
            throw createError("The AI service is unavailable right now. Please try again later.", 502, "GROQ_MODEL_UNAVAILABLE");
        }
        if (response.status === 429) {
            throw createError("The AI service is busy. Please wait a few minutes and try again.", 429, "GROQ_RATE_LIMITED");
        }
        if (response.status >= 500 && attempt === 0) {
            await wait(800);
            return requestGroqJson({ apiKey, model, prompt, schema, schemaName, maxTokens, attempt: 1 });
        }
        if (response.status >= 500) {
            throw createError("The AI service is temporarily unavailable. Please try again shortly.", 503, "GROQ_PROVIDER_UNAVAILABLE");
        }
        throw createError("The AI service could not generate a diet plan right now. Please try again.", 502, "GROQ_REQUEST_FAILED");
    }

    return parseGroqJson(responseBody);
};

const generateWithGroq = async (input, basePlan) => {
    const { apiKey, model } = getGroqConfig();
    const safeProfile = {
        goal: basePlan.profile.goalLabel,
        dietaryPreference: input.diet,
        activityLevel: input.activityLevel,
        mealsPerDay: input.mealsPerDay,
        budgetStyle: input.budget,
        weeklyBudgetInr: input.weeklyBudgetInr,
        cuisineStyle: input.cuisineStyle,
        cookingStyle: input.cookingStyle,
        workoutSchedule: {
            time: input.workoutTime,
            days: input.workoutDays,
        },
        foodPreferences: {
            notes: input.dietaryNotes || "None provided",
            favouriteFoods: input.favouriteFoods || "None provided",
            foodsToAvoid: input.avoidFoods || "None provided",
        },
        fixedDailyTargets: basePlan.dailyTargets,
        mealStructure: basePlan.mealStructure.map((day) => ({
            day: day.day,
            meals: day.meals.map((meal) => ({
                label: meal.label,
                targetCalories: meal.targetCalories,
            })),
        })),
    };

    const prompt = `You are FitSwap's wellness meal-planning assistant. Create practical, varied Indian-food meal suggestions for a healthy adult. This is general fitness guidance only, not medical advice. Do not diagnose conditions, mention treatment, recommend supplements or medicines, claim to manage disease, use extreme restrictions, or change the fixed calories/macros. Honour vegan/vegetarian preferences, cuisine, cooking, workout, and food preferences. If a weekly INR budget is provided, prefer realistic home-cooked, locally available ingredients and offer cost-conscious choices. Use clear, concise suggestions with normal household portions; do not claim exact price or nutrition values for individual dishes.\n\nThe weeklyPlan must have exactly 7 ordered days. Every day must have exactly the same number and order of meal entries as the provided mealStructure. Provide a consolidated groceryList for the week, grouped into 3–6 practical categories. Give approximate household quantities, never prices.\n\nProfile and fixed structure:\n${JSON.stringify(safeProfile)}`;

    const generated = await requestGroqJson({
        apiKey,
        model,
        prompt,
        schema: dietPlanSchema,
        schemaName: "diet_plan",
        maxTokens: 4096,
    });
    const weeklyPlan = normaliseWeeklyPlan(generated.weeklyPlan, basePlan.mealStructure);
    const budgetTips = Array.isArray(generated.budgetTips)
        ? generated.budgetTips.map((tip) => cleanText(tip, 220)).filter(Boolean).slice(0, 3)
        : [];
    const groceryList = Array.isArray(generated.groceryList)
        ? generated.groceryList.map((group) => ({
            category: cleanText(group?.category, 60),
            items: Array.isArray(group?.items)
                ? group.items.map((item) => ({
                    name: cleanText(item?.name, 80),
                    quantity: cleanText(item?.quantity, 80),
                })).filter((item) => item.name && item.quantity).slice(0, 10)
                : [],
        })).filter((group) => group.category && group.items.length).slice(0, 6)
        : [];

    return {
        model: "FitSwap AI",
        generationMethod: "ai-generated-wellness-guidance",
        requiresProfessionalReview: false,
        profile: basePlan.profile,
        dailyTargets: basePlan.dailyTargets,
        headline: cleanText(generated.headline, 100) || "Your AI-created nutrition rhythm",
        summary: cleanText(generated.summary, 220),
        weeklyPlan,
        groceryList,
        guidance: {
            budgetTip: budgetTips.join(" ") || "Choose local, seasonal ingredients and repeat simple home-cooked staples to reduce waste.",
            mealTiming: cleanText(generated.mealTiming, 240) || "Keep meals consistent and include protein around training when it suits your routine.",
            preparationTip: cleanText(generated.preparationTip, 240) || "Prep basic ingredients such as dal, vegetables, and protein sources ahead of busy days.",
            dietaryNotes: input.dietaryNotes || null,
        },
        reasons: [
            basePlan.goalMessage,
            `Your activity level is used to estimate maintenance energy near ${basePlan.dailyTargets.estimatedMaintenanceCalories} kcal/day.`,
            input.weeklyBudgetInr
                ? `Your AI plan is designed to keep weekly food ideas mindful of a ₹${input.weeklyBudgetInr} budget.`
                : `Your AI plan is designed to use ${input.budget.toLowerCase()} budget-friendly meal ideas.`,
        ],
        warnings: [
            "This is AI-generated general fitness guidance, not medical advice or a treatment plan.",
            "Food availability, portions, and costs vary. Adjust choices to your real situation and consult a qualified professional for individual medical needs.",
        ],
    };
};

const validateMealSwapInput = (rawInput = {}) => {
    const input = validateInput(rawInput.profile);
    const day = readNumber(rawInput.day, "Day", 1, 7);
    const mealLabel = cleanText(rawInput.mealLabel, 40);
    const currentSuggestion = cleanText(rawInput.currentSuggestion, 280);
    const targetCalories = readNumber(rawInput.targetCalories, "Meal calories", 100, 2000);

    if (!mealLabel || !currentSuggestion) {
        throw createError("Choose a meal to swap.");
    }
    if (needsProfessionalReview(input)) {
        throw createError(
            "FitSwap cannot safely swap meals for a medical or allergy-related profile. Please ask a qualified professional.",
            422,
            "GROQ_PROFESSIONAL_REVIEW_REQUIRED"
        );
    }

    return { input, day, mealLabel, currentSuggestion, targetCalories };
};

const swapDietMeal = async (rawInput) => {
    const { input, day, mealLabel, currentSuggestion, targetCalories } = validateMealSwapInput(rawInput);
    const { apiKey, model } = getGroqConfig();
    const safeProfile = {
        dietaryPreference: input.diet,
        cuisineStyle: input.cuisineStyle,
        cookingStyle: input.cookingStyle,
        budgetStyle: input.budget,
        weeklyBudgetInr: input.weeklyBudgetInr,
        workoutSchedule: { time: input.workoutTime, days: input.workoutDays },
        foodPreferences: {
            notes: input.dietaryNotes || "None provided",
            favouriteFoods: input.favouriteFoods || "None provided",
            foodsToAvoid: input.avoidFoods || "None provided",
        },
    };
    const prompt = `You are FitSwap's wellness meal-planning assistant. Replace exactly one meal with a practical Indian-food alternative for a healthy adult. This is general fitness guidance only, not medical advice. Do not mention treatment, supplements, medicines, disease management, allergies, or exact nutritional claims. Honour every supplied preference. Keep the replacement close to the supplied calorie target using normal household portions. Return a concise suggestion and a brief practical note.\n\nMeal to replace:\n${JSON.stringify({ day, mealLabel, targetCalories, currentSuggestion })}\n\nProfile:\n${JSON.stringify(safeProfile)}`;
    const generated = await requestGroqJson({
        apiKey,
        model,
        prompt,
        schema: mealSwapSchema,
        schemaName: "meal_swap",
        maxTokens: 500,
    });
    const suggestion = cleanText(generated.suggestion, 280);

    if (!suggestion) {
        throw createError("Did not return a usable meal swap. Please try again.", 502, "GROQ_INVALID_PLAN");
    }

    return {
        suggestion,
        note: cleanText(generated.note, 180),
    };
};

const generateDietPlan = async (rawInput) => {
    const input = validateInput(rawInput);
    const basePlan = createBasePlan(input);

    if (needsProfessionalReview(input)) {
        return buildProfessionalReviewResponse(input, basePlan);
    }

    return generateWithGroq(input, basePlan);
};

module.exports = {
    generateDietPlan,
    swapDietMeal,
};
