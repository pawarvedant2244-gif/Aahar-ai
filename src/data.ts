import { DietPlan, UserProfile } from "./types";

// Premium pre-baked North Indian High Protein Diet Plan
export const SAMPLE_NORTH_INDIAN_PLAN: DietPlan = {
  planId: "sample-north-indian-1",
  createdAt: new Date().toISOString(),
  generalAdvice: "Focus on drinking lukewarm water in the morning. Limit your roti intake to multigrain options and maximize the thickness of your dal for high protein saturation. Ensure dinner is finished by 8:30 PM.",
  days: [
    {
      dayNumber: 1,
      dayName: "Monday",
      breakfast: {
        id: "b-1",
        name: "Paneer Oats Chilla",
        description: "2 medium savory oats pancakes stuffed with 50g crumbled paneer, coriander, and green chillies. Serve with green mint chutney.",
        calories: 320,
        protein: 16,
        carbs: 38,
        fat: 12,
        portionSize: "2 chillas (medium)"
      },
      lunch: {
        id: "l-1",
        name: "Lauki Kofta (Baked) with Missi Roti",
        description: "Baked bottle gourd dumplings in a light tomato-onion gravy. Serve with 1 multigrain roti and a bowl of fresh cucumber raita.",
        calories: 450,
        protein: 18,
        carbs: 62,
        fat: 13,
        portionSize: "1 cup kofta + 1 missi roti"
      },
      snacks: {
        id: "s-1",
        name: "Roasted Chana & Green Tea",
        description: "A small handful of dry roasted bengal gram flavored with cumin, black salt, and a hot cup of unsweetened organic green tea.",
        calories: 140,
        protein: 7,
        carbs: 22,
        fat: 3,
        portionSize: "1 cup (30g)"
      },
      dinner: {
        id: "d-1",
        name: "Moong Dal Khichdi & Stir-fry Beans",
        description: "Comforting moong dal and broken rice khichdi seasoned with cumin, ginger, and a small spoonful of pure cow ghee. Serve with sautéed French beans.",
        calories: 380,
        protein: 12,
        carbs: 58,
        fat: 10,
        portionSize: "1.5 bowls"
      },
      waterTargetLiters: 3.0,
      totalCalories: 1290,
      totalProtein: 53,
      totalCarbs: 180,
      totalFat: 38
    },
    {
      dayNumber: 2,
      dayName: "Tuesday",
      breakfast: {
        id: "b-2",
        name: "Sprouted Moong Salad",
        description: "Steamed whole green moong sprouts tossed with chopped cucumber, tomato, green apple, fresh coriander, and a splash of lemon juice.",
        calories: 260,
        protein: 14,
        carbs: 42,
        fat: 2,
        portionSize: "1 large bowl"
      },
      lunch: {
        id: "l-2",
        name: "Tandoori Soya Chaap & Roti",
        description: "2 skewered soya chaap pieces grilled in a tandoor with spices. Serve with 2 slim wheat chapatis and a generous bowl of mixed cabbage-carrot salad.",
        calories: 480,
        protein: 24,
        carbs: 58,
        fat: 14,
        portionSize: "2 pieces chaap + 2 chapatis"
      },
      snacks: {
        id: "s-2",
        name: "Masala Buttermilk & Almonds",
        description: "1 glass of cold churned curd buttermilk spiked with roasted cumin powder and black salt, paired with 5 soaked almonds.",
        calories: 110,
        protein: 5,
        carbs: 8,
        fat: 6,
        portionSize: "1 glass + 5 almonds"
      },
      dinner: {
        id: "d-2",
        name: "Soya Chunk Pulav with Veg Kadhi",
        description: "Basmati rice cooked with high-protein soya nuggets, peas, and mint, paired with a non-fried light Punjabi vegetable kadhi.",
        calories: 410,
        protein: 20,
        carbs: 64,
        fat: 8,
        portionSize: "1.5 plates"
      },
      waterTargetLiters: 3.0,
      totalCalories: 1260,
      totalProtein: 63,
      totalCarbs: 172,
      totalFat: 30
    },
    {
      dayNumber: 3,
      dayName: "Wednesday",
      breakfast: {
        id: "b-3",
        name: "Vegetable Upma with Sambar",
        description: "Roasted semolina cooked with carrots, beans, peas, and curry leaves. Served with a bowl of homemade piping hot vegetable sambar.",
        calories: 290,
        protein: 10,
        carbs: 52,
        fat: 5,
        portionSize: "1 plate + 1 cup sambar"
      },
      lunch: {
        id: "l-3",
        name: "Jeera Rice & Yellow Moong Dal",
        description: "Steamed jeera basmati rice paired with a simple home-style yellow moong dal tadka and a bowl of bhindi do-pyaza (sautéed okra).",
        calories: 460,
        protein: 15,
        carbs: 72,
        fat: 12,
        portionSize: "1 bowl rice + 1.5 bowls dal"
      },
      snacks: {
        id: "s-3",
        name: "Spiced Makhana (Foxnuts)",
        description: "Crunchy makhana dry roasted with a pinch of turmeric, black pepper, and Himalayan pink salt in 1/2 tsp olive oil.",
        calories: 120,
        protein: 3,
        carbs: 20,
        fat: 4,
        portionSize: "1.5 cups (35g)"
      },
      dinner: {
        id: "d-3",
        name: "Paneer Bhurji with Methi Paratha",
        description: "100g soft fresh paneer scrambled with onions, capsicum, and turmeric. Serve with 1 non-oily wheat methi (fenugreek) paratha.",
        calories: 440,
        protein: 22,
        carbs: 38,
        fat: 22,
        portionSize: "1 bowl bhurji + 1 methi paratha"
      },
      waterTargetLiters: 3.0,
      totalCalories: 1310,
      totalProtein: 50,
      totalCarbs: 182,
      totalFat: 43
    },
    {
      dayNumber: 4,
      dayName: "Thursday",
      breakfast: {
        id: "b-4",
        name: "Boiled Eggs / Tofu Scramble",
        description: "2 whole organic boiled eggs with black pepper (or 120g sautéed yellow tofu for veg preferences) paired with 1 slice of whole wheat toast.",
        calories: 280,
        protein: 18,
        carbs: 22,
        fat: 12,
        portionSize: "2 eggs + 1 toast"
      },
      lunch: {
        id: "l-4",
        name: "Kala Chana Chaat & Barley Roti",
        description: "Zesty salad made of boiled black chickpeas, onions, tomatoes, green chillies, and chaat masala. Served with 1 barleychapati.",
        calories: 430,
        protein: 19,
        carbs: 68,
        fat: 8,
        portionSize: "1.5 bowls chaat + 1 chapati"
      },
      snacks: {
        id: "s-4",
        name: "Coconut Water & Mixed Seeds",
        description: "1 glass of fresh tender coconut water paired with a mix of chia, flax, and pumpkin seeds.",
        calories: 130,
        protein: 4,
        carbs: 12,
        fat: 8,
        portionSize: "1 glass + 1 tbsp seeds"
      },
      dinner: {
        id: "d-4",
        name: "Egg/Paneer Curry with Brown Rice",
        description: "Rich but light curry cooked with 2 boiled eggs (or 100g paneer cubes) in tomato-onion paste, served with 1 cup steamed brown basmati rice.",
        calories: 460,
        protein: 21,
        carbs: 52,
        fat: 18,
        portionSize: "1 plate curry + rice"
      },
      waterTargetLiters: 3.0,
      totalCalories: 1300,
      totalProtein: 62,
      totalCarbs: 154,
      totalFat: 46
    },
    {
      dayNumber: 5,
      dayName: "Friday",
      breakfast: {
        id: "b-5",
        name: "Suji Veg Idli with Coconut Chutney",
        description: "3 steamed semolina idlis packed with carrots, peas, and sweet corn. Serve with 1 tbsp fresh grated coconut-green chutney.",
        calories: 290,
        protein: 8,
        carbs: 48,
        fat: 7,
        portionSize: "3 idlis + chutney"
      },
      lunch: {
        id: "l-5",
        name: "Palak Paneer with Multigrain Chapati",
        description: "Fresh spinach purée cooked with 80g low-fat cottage cheese cubes, ginger, and garlic. Serve with 2 thin dry-toasted multigrain rotis.",
        calories: 450,
        protein: 21,
        carbs: 46,
        fat: 18,
        portionSize: "1.5 bowls paneer + 2 rotis"
      },
      snacks: {
        id: "s-5",
        name: "Roasted Makhana & Walnuts",
        description: "Crunchy roasted lotus seeds paired with 3 halves of premium walnuts for rich Omega-3 fatty acids.",
        calories: 150,
        protein: 4,
        carbs: 18,
        fat: 9,
        portionSize: "1 bowl + 3 walnuts"
      },
      dinner: {
        id: "d-5",
        name: "Boiled Yellow Moong Dal Khichdi",
        description: "Easy digest wheat-dal split khichdi served with roasted papad and 1 tablespoon of home fermented spiced cucumber raita.",
        calories: 360,
        protein: 13,
        carbs: 62,
        fat: 6,
        portionSize: "1.5 bowls"
      },
      waterTargetLiters: 3.2,
      totalCalories: 1250,
      totalProtein: 46,
      totalCarbs: 174,
      totalFat: 40
    },
    {
      dayNumber: 6,
      dayName: "Saturday",
      breakfast: {
        id: "b-6",
        name: "Poha with Roasted Peanuts",
        description: "Beaten rice flakes tempered with mustard seeds, curry leaves, onions, potatoes, and peanuts. Garnish with lemon juice and coriander.",
        calories: 280,
        protein: 6,
        carbs: 52,
        fat: 6,
        portionSize: "1 large plate"
      },
      lunch: {
        id: "l-6",
        name: "Mixed Dal Tadka & Mix Veg Sabzi",
        description: "High protein dal blend (Toor, Moong, Masoor) cooked home-style, served with 2 dry wheat rotis and a bowl of mixed cabbage and peas stir-fry.",
        calories: 440,
        protein: 18,
        carbs: 64,
        fat: 12,
        portionSize: "1 bowl dal + 2 rotis + 1 bowl sabzi"
      },
      snacks: {
        id: "s-6",
        name: "Apple Slices with Peanut Butter",
        description: "1 crisp local sweet apple sliced and served with 1 tablespoon of unsweetened crunchy peanut butter.",
        calories: 160,
        protein: 4,
        carbs: 22,
        fat: 8,
        portionSize: "1 apple + 1 tbsp peanut butter"
      },
      dinner: {
        id: "d-6",
        name: "Grilled Paneer/Chicken Tikka Salad",
        description: "120g skewed spiced paneer cubes (or breast chicken fillets for non-veg) grilled with capsicum, onions, and tomato, served as a large warm salad.",
        calories: 390,
        protein: 26,
        carbs: 14,
        fat: 25,
        portionSize: "1 massive plate"
      },
      waterTargetLiters: 3.0,
      totalCalories: 1270,
      totalProtein: 54,
      totalCarbs: 152,
      totalFat: 51
    },
    {
      dayNumber: 7,
      dayName: "Sunday",
      breakfast: {
        id: "b-7",
        name: "Moong Dal Stuffed Paratha",
        description: "1 thick whole wheat flatbread stuffed with spiced cooked moong dal, griddled with a trace of butter. Served with a bowl of homemade sour curd.",
        calories: 340,
        protein: 12,
        carbs: 48,
        fat: 11,
        portionSize: "1 paratha + 1 cup curd"
      },
      lunch: {
        id: "l-7",
        name: "Mushroom & Matar Curry with Rice",
        description: "Fresh button mushrooms and green peas cooked in rich North Indian tomato-cashew curry, served with a cup of brown basmati rice.",
        calories: 420,
        protein: 14,
        carbs: 62,
        fat: 14,
        portionSize: "1.5 cups curry + rice"
      },
      snacks: {
        id: "s-7",
        name: "Roasted Chana Chor Garam",
        description: "Tossed black chana flakes with lime juice, chopped tomato, onion, and red pepper flakes.",
        calories: 120,
        protein: 6,
        carbs: 18,
        fat: 2,
        portionSize: "1 bowl"
      },
      dinner: {
        id: "d-7",
        name: "Low-fat Paneer Bhurji & Chapati",
        description: "Quick scrambled paneer with fresh coriander, served with 1 wheat chapati and a simple sliced raw radish, onion, and lime salad.",
        calories: 380,
        protein: 20,
        carbs: 34,
        fat: 18,
        portionSize: "1 bowl bhurji + 1 chapati"
      },
      waterTargetLiters: 3.0,
      totalCalories: 1260,
      totalProtein: 52,
      totalCarbs: 162,
      totalFat: 45
    }
  ]
};

// Mock analytics data representing 10 days of progress
export const MOCK_HISTORY_LOGS = [
  { date: "2026-06-17", calories: 1420, protein: 55, carbs: 180, fat: 44, water: 2.5, weight: 78.5 },
  { date: "2026-06-18", calories: 1380, protein: 58, carbs: 172, fat: 40, water: 2.8, weight: 78.2 },
  { date: "2026-06-19", calories: 1310, protein: 52, carbs: 165, fat: 38, water: 3.0, weight: 78.0 },
  { date: "2026-06-20", calories: 1450, protein: 60, carbs: 190, fat: 48, water: 2.7, weight: 77.9 },
  { date: "2026-06-21", calories: 1280, protein: 50, carbs: 160, fat: 35, water: 3.1, weight: 77.6 },
  { date: "2026-06-22", calories: 1250, protein: 48, carbs: 155, fat: 32, water: 3.0, weight: 77.4 },
  { date: "2026-06-23", calories: 1320, protein: 54, carbs: 170, fat: 41, water: 3.2, weight: 77.1 },
  { date: "2026-06-24", calories: 1300, protein: 53, carbs: 165, fat: 39, water: 3.0, weight: 77.0 },
  { date: "2026-06-25", calories: 1290, protein: 55, carbs: 168, fat: 38, water: 3.1, weight: 76.8 },
  { date: "2026-06-26", calories: 1260, protein: 53, carbs: 162, fat: 30, water: 3.0, weight: 76.5 }
];

export const DEFAULT_PROFILE: UserProfile = {
  email: "pawarvedant2244@gmail.com",
  fullName: "Vedant Pawar",
  onboarded: true,
  onboardingData: {
    age: 28,
    gender: "female",
    height: 162,
    weight: 76.5,
    activityLevel: "moderately_active",
    dietType: "veg",
    exclusions: ["beef", "pork"],
    medicalConditions: ["none"],
    regionalPreference: "North Indian",
    healthGoal: "weight_loss",
    calorieTarget: 1300
  },
  dietPlan: SAMPLE_NORTH_INDIAN_PLAN,
  dailyLogs: [],
  emailSettings: {
    dailyMealDigest: true,
    hydrationReminders: true,
    weightCheckIn: false,
    emailAddress: "pawarvedant2244@gmail.com",
    notificationTime: "07:30"
  }
};
