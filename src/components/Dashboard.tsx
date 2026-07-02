import React, { useState, useEffect } from "react";
import { Flame, Droplet, Dumbbell, Apple, Sparkles, Plus, CheckCircle2, QrCode, BellRing, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile, LoggedMeal, Meal } from "../types";
import GoogleTasksWidget from "./GoogleTasksWidget";
import GoogleGmailWidget from "./GoogleGmailWidget";
import { auth } from "../lib/firebase";

interface DashboardProps {
  userProfile: UserProfile;
  onNavigate: (tab: string) => void;
  onQuickAddWater: (liters: number) => void;
  onToggleMealLog: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal: Meal) => void;
  onInitiateSwap: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => void;
}

export default function Dashboard({ userProfile, onNavigate, onQuickAddWater, onToggleMealLog, onInitiateSwap }: DashboardProps) {
  const data = userProfile.onboardingData;
  const currentDayPlan = userProfile.dietPlan?.days?.[0]; // Let's display Day 1 targets & meals as current today

  // Safe checks for profiles
  const targetCalories = data?.calorieTarget || 1300;
  const targetWater = currentDayPlan?.waterTargetLiters || 3.0;
  const targetProtein = Math.round(targetCalories * 0.20 / 4); // 20% protein
  const targetCarbs = Math.round(targetCalories * 0.50 / 4); // 50% carbs
  const targetFat = Math.round(targetCalories * 0.30 / 9); // 30% fat

  const today = new Date().toISOString().split("T")[0];
  const todayLog = userProfile.dailyLogs?.find(log => log.date === today) || { date: today, mealsLogged: [], waterDrankLiters: 0 };
  
  // Calculations
  const consumedCalories = todayLog.mealsLogged.reduce((sum, m) => sum + m.calories, 0);
  const consumedProtein = todayLog.mealsLogged.reduce((sum, m) => sum + m.protein, 0);
  const consumedCarbs = todayLog.mealsLogged.reduce((sum, m) => sum + m.carbs, 0);
  const consumedFat = todayLog.mealsLogged.reduce((sum, m) => sum + m.fat, 0);
  const waterDrank = todayLog.waterDrankLiters;

  const calPercentage = Math.min(Math.round((consumedCalories / targetCalories) * 100), 100);
  const proteinPercentage = Math.min(Math.round((consumedProtein / targetProtein) * 100), 100);
  const carbsPercentage = Math.min(Math.round((consumedCarbs / targetCarbs) * 100), 100);
  const fatPercentage = Math.min(Math.round((consumedFat / targetFat) * 100), 100);
  const waterPercentage = Math.min(Math.round((waterDrank / targetWater) * 100), 100);

  // Check if a meal is currently logged
  const isLogged = (type: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    return todayLog.mealsLogged.some(m => m.type === type);
  };

  const [waterAdding, setWaterAdding] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLinked(!!user);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleAddWater = (amt: number) => {
    setWaterAdding(true);
    onQuickAddWater(amt);
    setTimeout(() => setWaterAdding(false), 500);
  };

  return (
    <div id="home-dashboard" className="space-y-6 pb-28">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            Namaste, {userProfile.fullName || "Aahar User"}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 font-mono uppercase tracking-wider drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]">
            Today is Monday • {userProfile.onboardingData?.regionalPreference || "North Indian"} {userProfile.onboardingData?.dietType === "veg" ? "Veg🌱" : "Non-Veg🍗"} Plan
          </p>
        </div>
        
        {/* Real Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono shadow-lg border bg-black/50 transition-all ${
            isLinked 
              ? "text-mecha-neon border-mecha-neon/20" 
              : "text-amber-400 border-amber-400/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLinked ? "bg-mecha-neon animate-pulse" : "bg-amber-400"}`} />
            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {isLinked ? "WORKSPACE: CONNECTED" : "WORKSPACE: DISCONNECTED"}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono shadow-lg border bg-black/50 transition-all ${
            isOnline 
              ? "text-mecha-neon border-mecha-neon/20" 
              : "text-red-400 border-red-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-mecha-neon animate-pulse" : "bg-red-500"}`} />
            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {isOnline ? "NETWORK: ONLINE" : "NETWORK: OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Rings & Calories Core summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Ring Meter Card */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-mecha-green/5 rounded-full blur-3xl" />
          
          <div className="space-y-4 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-tea-mist">Daily Budget</span>
              <h3 className="text-4xl font-display font-extrabold text-white mt-1">
                {targetCalories - consumedCalories} <span className="text-lg font-normal text-tea-mist">kcal left</span>
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center sm:justify-start">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-mecha-neon" />
                <span className="text-xs text-tea-mist font-mono">{consumedCalories} consumed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-glass-border" />
                <span className="text-xs text-tea-mist font-mono">{targetCalories} goal</span>
              </div>
            </div>
          </div>

          {/* Calorie Ring SVG Meter */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-glass-border fill-transparent"
                strokeWidth="10"
              />
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-mecha-neon fill-transparent transition-all duration-500"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 62}
                strokeDashoffset={2 * Math.PI * 62 * (1 - calPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <Flame className="w-6 h-6 text-mecha-neon glow-glow mb-0.5" />
              <span className="text-lg font-display font-bold text-white">{calPercentage}%</span>
              <span className="text-[9px] text-tea-mist uppercase tracking-widest font-mono">Calorie Target</span>
            </div>
          </div>
        </div>

        {/* Macros Breakdown Cards */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-widest text-bamboo-beige font-bold">Macros Target Status</h4>
          
          <div className="space-y-3.5">
            {/* Protein */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-bamboo-beige/90 flex items-center gap-1"><Dumbbell className="w-3 h-3 text-emerald-400" /> Protein (g)</span>
                <span className="font-mono text-tea-mist">{consumedProtein} / {targetProtein}g</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-glass-border/30">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${proteinPercentage}%` }} />
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-bamboo-beige/90 flex items-center gap-1"><Apple className="w-3 h-3 text-amber-400" /> Carbs (g)</span>
                <span className="font-mono text-tea-mist">{consumedCarbs} / {targetCarbs}g</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-glass-border/30">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${carbsPercentage}%` }} />
              </div>
            </div>

            {/* Fats */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-bamboo-beige/90 flex items-center gap-1"><Flame className="w-3 h-3 text-rose-400" /> Fats (g)</span>
                <span className="font-mono text-tea-mist">{consumedFat} / {targetFat}g</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-glass-border/30">
                <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${fatPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing Quick action widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hydration Tracker */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-mono uppercase tracking-widest text-bamboo-beige font-bold flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-400" /> Water Logging
            </h4>
            <span className="text-xs text-sky-400 font-bold font-mono">{waterDrank.toFixed(1)} / {targetWater}L</span>
          </div>

          <div className="flex justify-center items-center py-4">
            <motion.div 
              animate={waterAdding ? { scale: [1, 1.1, 1] } : {}}
              className="relative w-24 h-24 rounded-full bg-sky-950/40 border border-sky-400/20 flex flex-col items-center justify-center cursor-pointer shadow-lg hover:border-sky-400/50 transition-all duration-300"
              onClick={() => handleAddWater(0.25)}
            >
              <Droplet className="w-8 h-8 text-sky-400 animate-bounce" />
              <span className="text-[10px] text-sky-200 mt-1 uppercase font-mono tracking-widest">Tap to +250ml</span>
            </motion.div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleAddWater(0.25)} 
              className="flex-1 py-1.5 rounded-lg bg-black/40 border border-sky-400/20 text-[10px] text-sky-300 font-mono hover:bg-sky-950/20 cursor-pointer"
            >
              +1 Glass (250ml)
            </button>
            <button 
              onClick={() => handleAddWater(1.0)} 
              className="flex-1 py-1.5 rounded-lg bg-black/40 border border-sky-400/20 text-[10px] text-sky-300 font-mono hover:bg-sky-950/20 cursor-pointer"
            >
              +1 Bottle (1L)
            </button>
          </div>
        </div>

        {/* AI Suggestion Card */}
        <div className="glass-panel rounded-3xl p-6 space-y-3 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-2 top-2">
            <Sparkles className="w-5 h-5 text-mecha-neon opacity-45 glow-glow" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-mecha-neon bg-mecha-green/10 border border-mecha-green/20 px-2 py-0.5 rounded-md inline-block">
              Aahar AI Suggestion
            </span>
            <h4 className="text-sm font-bold text-white leading-snug">Metabolic Fluid optimization</h4>
            <p className="text-xs text-tea-mist leading-relaxed mt-1">
              "Based on your regional North Indian veggie profile, adding a glass of masala buttermilk with toasted cumin powder after lunch today will soothe your digestion, accelerate thyroid uptake, and boost minerals!"
            </p>
          </div>

          <button 
            onClick={() => onNavigate("chat")}
            className="w-full py-2 rounded-xl bg-mecha-green/10 hover:bg-mecha-green/20 text-mecha-neon font-semibold text-xs border border-mecha-neon/20 hover:border-mecha-neon/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            Ask Diet Assistant
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Barcode / Photo Logger shortcuts & Notifications */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 flex flex-col justify-between relative">
          <div className="space-y-3.5">
            <h4 className="text-xs font-mono uppercase tracking-widest text-bamboo-beige font-bold flex items-center gap-2">
              <BellRing className="w-4 h-4 text-mecha-neon" /> Daily Reminders
            </h4>
            
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-black/30 border border-glass-border/30 flex items-center justify-between text-xs">
                <span className="text-tea-mist/90">Hydration Interval Check</span>
                <span className="text-[10px] font-mono text-mecha-neon bg-mecha-green/10 border border-mecha-neon/20 px-1.5 py-0.5 rounded">03:00 PM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-glass-border/30 flex items-center justify-between text-xs">
                <span className="text-tea-mist/90">Weight Check-in</span>
                <span className="text-[10px] font-mono text-tea-mist/60 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">Pending</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigate("scanner")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon text-black font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Launch AI Food Scanner
          </button>
        </div>
      </div>

      {/* Google Tasks Integrator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoogleTasksWidget userProfile={userProfile} />
        <GoogleGmailWidget userProfile={userProfile} />
      </div>

      {/* Expandable Trend Block teaser */}
      <div 
        onClick={() => onNavigate("analytics")}
        className="glass-panel rounded-3xl p-4 flex items-center justify-between cursor-pointer border border-glass-border/40 hover:border-mecha-neon/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mecha-green/10 flex items-center justify-center text-mecha-neon border border-mecha-neon/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-sans">Click to Expand Metrics & Analytics</h4>
            <p className="text-[10px] text-tea-mist leading-none mt-0.5">View weight loss velocity, macro balances, and daily water history graphs.</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-tea-mist" />
      </div>

      {/* MEAL CARDS (Breakfast, Lunch, Dinner, Snacks) */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase tracking-widest text-bamboo-beige font-bold">Today's Curated Meals</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: 'breakfast' as const, title: 'Breakfast 🍳', time: '08:30 AM', meal: currentDayPlan?.breakfast },
            { type: 'lunch' as const, title: 'Lunch 🍱', time: '01:15 PM', meal: currentDayPlan?.lunch },
            { type: 'snacks' as const, title: 'Evening Snacks ☕', time: '05:30 PM', meal: currentDayPlan?.snacks },
            { type: 'dinner' as const, title: 'Dinner 🥗', time: '08:30 PM', meal: currentDayPlan?.dinner }
          ].map((item) => {
            const completed = isLogged(item.type);
            const meal = item.meal || { name: "Indian Diet Recipe", description: "", calories: 350, protein: 15, carbs: 45, fat: 10, portionSize: "1 plate" };
            return (
              <div 
                key={item.type}
                className={`glass-panel rounded-2xl p-5 border transition-all duration-300 relative flex flex-col justify-between space-y-3 ${
                  completed ? 'border-mecha-green/40 bg-mecha-green/5' : 'border-glass-border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-tea-mist uppercase tracking-widest">{item.title}</span>
                      <span className="text-[9px] text-tea-mist/60 bg-black/30 px-1.5 py-0.5 rounded border border-glass-border/40 font-mono">{item.time}</span>
                    </div>
                    <h5 className="text-base font-bold text-white mt-1.5">{meal.name}</h5>
                    <p className="text-xs text-tea-mist/90 mt-1 line-clamp-2 leading-relaxed">{meal.description}</p>
                  </div>

                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <button
                      id={`btn-log-${item.type}`}
                      onClick={() => onToggleMealLog(item.type, meal as Meal)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${
                        completed 
                          ? 'bg-mecha-green/20 border-mecha-neon text-mecha-neon shadow-[0_0_12px_rgba(0,255,136,0.2)]' 
                          : 'bg-black/40 border-glass-border text-tea-mist hover:text-white hover:border-tea-mist/40'
                      }`}
                      title={completed ? "Remove meal log" : "Log this curated meal"}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <button
                      id={`btn-swap-${item.type}`}
                      onClick={() => onInitiateSwap(item.type)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/40 border border-glass-border text-tea-mist hover:text-white hover:border-mecha-neon/40 hover:bg-mecha-green/5 transition-all cursor-pointer"
                      title="Swap this curated meal with an AI scanned food"
                    >
                      <QrCode className="w-4 h-4 text-mecha-neon" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-glass-border/30 pt-3">
                  <span className="text-xs text-bamboo-beige font-mono">{meal.portionSize}</span>
                  <div className="flex gap-3 text-[10px] font-mono text-tea-mist/85">
                    <span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
