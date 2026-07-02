export interface OnboardingData {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  dietType: 'veg' | 'eggetarian' | 'non_veg' | 'vegan';
  exclusions: string[]; // e.g., ["beef", "pork", "gluten", "nuts"]
  medicalConditions: string[]; // e.g., ["diabetes", "thyroid", "hypertension"]
  regionalPreference: string; // North Indian, South Indian, Maharashtrian, Bengali, Gujarati, etc.
  healthGoal: 'weight_loss' | 'weight_gain' | 'muscle_building' | 'maintain';
  calorieTarget?: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  portionSize: string; // e.g., "2 chapatis + 1 bowl dal"
  time?: string;
}

export interface DayPlan {
  dayNumber: number;
  dayName: string; // e.g., "Monday"
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
  waterTargetLiters: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DietPlan {
  planId: string;
  createdAt: string;
  days: DayPlan[];
  generalAdvice: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isAnalyzingFood?: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  mealsLogged: LoggedMeal[];
  waterDrankLiters: number;
  weightProgressKg?: number;
}

export interface LoggedMeal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface EmailSettings {
  dailyMealDigest: boolean;
  hydrationReminders: boolean;
  weightCheckIn: boolean;
  emailAddress: string;
  notificationTime: string; // "07:00"
}

export interface UserProfile {
  email: string;
  fullName: string;
  onboarded: boolean;
  onboardingData?: OnboardingData;
  dietPlan?: DietPlan;
  dailyLogs: DailyLog[];
  emailSettings: EmailSettings;
  customPasswordHash?: string;
}
