import React, { useState, useEffect } from "react";
import { Sparkles, Home, CalendarRange, MessageSquareCode, QrCode, TrendingUp, Settings, LogOut, Moon, Sun, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { UserProfile, OnboardingData, DietPlan, Meal, DailyLog } from "./types";
import { DEFAULT_PROFILE } from "./data";
import { initAuth, fetchUserProfile, saveUserProfile, logout, auth } from "./lib/firebase";

// Component imports
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import MealPlanView from "./components/MealPlanView";
import AssistantChat from "./components/AssistantChat";
import Scanner from "./components/Scanner";
import Analytics from "./components/Analytics";
import ProfileSettings from "./components/ProfileSettings";

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [initializing, setInitializing] = useState(true);
  const [scanReplacementTarget, setScanReplacementTarget] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem("aahar_theme") as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
    localStorage.setItem("aahar_theme", theme);
  }, [theme]);

  // Sync state with Firebase auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser) => {
        try {
          const dbProfile = await fetchUserProfile(firebaseUser.uid);
          if (dbProfile) {
            setUserProfile(dbProfile);
          } else {
            // fallback
            const saved = localStorage.getItem("aahar_user_profile");
            if (saved) {
              setUserProfile(JSON.parse(saved));
            }
          }
        } catch (e) {
          console.error("Failed to load user profile from Firestore:", e);
        } finally {
          setInitializing(false);
        }
      },
      () => {
        // No firebase user, try local storage fallback for demo
        const saved = localStorage.getItem("aahar_user_profile");
        if (saved) {
          try {
            setUserProfile(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse saved user profile:", e);
          }
        }
        setInitializing(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save to local & Firestore when profile changes
  const saveProfile = async (newProfile: UserProfile | null) => {
    setUserProfile(newProfile);
    if (newProfile) {
      localStorage.setItem("aahar_user_profile", JSON.stringify(newProfile));
      if (auth.currentUser) {
        try {
          await saveUserProfile(auth.currentUser.uid, newProfile);
        } catch (e) {
          console.error("Failed to sync profile to Firestore:", e);
        }
      }
    } else {
      localStorage.removeItem("aahar_user_profile");
    }
  };

  // Auth logins
  const handleLoginSuccess = (profile: UserProfile) => {
    saveProfile(profile);
    if (profile.onboarded) {
      setActiveTab("dashboard");
    }
  };

  // Onboarding completion
  const handleOnboardingComplete = (data: OnboardingData, plan: DietPlan) => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      onboarded: true,
      onboardingData: data,
      dietPlan: plan
    };
    saveProfile(updated);
    setActiveTab("dashboard");
  };

  // Trigger re-onboarding
  const handleReOnboard = () => {
    if (!userProfile) return;
    saveProfile({
      ...userProfile,
      onboarded: false
    });
  };

  // Daily tracker mutations
  const handleQuickAddWater = (liters: number) => {
    if (!userProfile) return;
    
    const today = new Date().toISOString().split("T")[0];
    const updatedLogs = [...userProfile.dailyLogs];
    const todayIndex = updatedLogs.findIndex(log => log.date === today);

    if (todayIndex > -1) {
      updatedLogs[todayIndex] = {
        ...updatedLogs[todayIndex],
        waterDrankLiters: Math.round((updatedLogs[todayIndex].waterDrankLiters + liters) * 100) / 100
      };
    } else {
      updatedLogs.unshift({
        date: today,
        waterDrankLiters: liters,
        mealsLogged: []
      });
    }

    saveProfile({
      ...userProfile,
      dailyLogs: updatedLogs
    });
  };

  const handleToggleMealLog = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal: Meal) => {
    if (!userProfile) return;

    const today = new Date().toISOString().split("T")[0];
    const updatedLogs = [...userProfile.dailyLogs];
    const todayIndex = updatedLogs.findIndex(log => log.date === today);

    let activeLog: DailyLog;
    
    if (todayIndex > -1) {
      activeLog = { ...updatedLogs[todayIndex] };
    } else {
      activeLog = { date: today, waterDrankLiters: 0, mealsLogged: [] };
    }

    const alreadyLoggedIndex = activeLog.mealsLogged.findIndex(m => m.type === mealType);

    if (alreadyLoggedIndex > -1) {
      // Remove it
      activeLog.mealsLogged = activeLog.mealsLogged.filter(m => m.type !== mealType);
    } else {
      // Add it
      activeLog.mealsLogged.push({
        id: `meal-log-${Date.now()}`,
        type: mealType,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    if (todayIndex > -1) {
      updatedLogs[todayIndex] = activeLog;
    } else {
      updatedLogs.unshift(activeLog);
    }

    saveProfile({
      ...userProfile,
      dailyLogs: updatedLogs
    });
  };

  const handleLogMealScanned = (type: 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal: Meal) => {
    handleToggleMealLog(type, meal);
    setActiveTab("dashboard");
  };

  const handleInitiateSwap = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    setScanReplacementTarget(mealType);
    setActiveTab("scanner");
  };

  const handleReplaceCuratedMeal = (type: 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal: Meal) => {
    if (!userProfile || !userProfile.dietPlan) return;
    
    const updatedDietPlan = { ...userProfile.dietPlan };
    if (updatedDietPlan.days && updatedDietPlan.days.length > 0) {
      updatedDietPlan.days[0] = {
        ...updatedDietPlan.days[0],
        [type]: {
          ...meal,
          id: meal.id || `${type}-${Date.now()}`
        }
      };
    }

    saveProfile({
      ...userProfile,
      dietPlan: updatedDietPlan
    });
    setActiveTab("dashboard");
  };

  const handleUpdateEmailSettings = (settings: UserProfile['emailSettings']) => {
    if (!userProfile) return;
    saveProfile({
      ...userProfile,
      emailSettings: settings
    });
  };

  const handleLogout = async () => {
    await logout();
    setUserProfile(null);
    localStorage.removeItem("aahar_user_profile");
    setActiveTab("dashboard");
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent relative overflow-hidden">
        <div className="liquid-blob-1" />
        <div className="liquid-blob-2" />
        <div className="w-10 h-10 border-4 border-mecha-neon/20 border-t-mecha-neon rounded-full animate-spin mb-4 relative z-10" />
        <span className="text-xs text-tea-mist font-mono uppercase tracking-widest relative z-10">Aahar Client Initializing...</span>
      </div>
    );
  }

  const renderContent = () => {
    // Not logged in
    if (!userProfile) {
      return <Auth onLoginSuccess={handleLoginSuccess} />;
    }

    // Logged in but not onboarded yet
    if (!userProfile.onboarded) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    return (
      <div className="min-h-screen flex flex-col justify-between max-w-5xl mx-auto px-4 md:px-6 relative">
        {/* Premium Apple styled status bar background/hologram */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-mecha-green/5 to-transparent blur-3xl pointer-events-none" />

        {/* App Shell Header */}
        <header className="mt-4 px-5 py-3.5 rounded-2xl glass-panel-heavy flex justify-between items-center relative z-10 border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mecha-green/20 border border-mecha-neon/50 flex items-center justify-center text-mecha-neon shadow-[0_0_12px_rgba(74,222,128,0.2)]">
              <Bot className="w-4.5 h-4.5 glow-glow" />
            </div>
            <div>
              <h1 className="text-base font-display font-extrabold text-white leading-none tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Aahar AI</h1>
              <span className="text-[9px] font-mono text-emerald-100 uppercase tracking-widest block mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Indian Clinical Wellness</span>
            </div>
          </div>

          {/* Action center header buttons */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 border border-glass-border px-3 py-1.5 rounded-xl text-bamboo-beige cursor-pointer transition-all"
              title={theme === 'dark' ? "Switch to Light Green Mode" : "Switch to Dark Glass Mode"}
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-mecha-neon animate-pulse" />
                  <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] text-[10px] hidden sm:inline">Dark Glass Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-mecha-neon animate-pulse" />
                  <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] text-[10px] hidden sm:inline">Light Green Mode</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 bg-red-500/10 cursor-pointer transition-colors"
              title="Sign out of portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Container Views with sliding transitions */}
        <main className="flex-1 py-6 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              {activeTab === "dashboard" && (
                <Dashboard 
                  userProfile={userProfile} 
                  onNavigate={setActiveTab}
                  onQuickAddWater={handleQuickAddWater}
                  onToggleMealLog={handleToggleMealLog}
                  onInitiateSwap={handleInitiateSwap}
                />
              )}
              {activeTab === "mealplan" && (
                <MealPlanView 
                  dietPlan={userProfile.dietPlan!} 
                  userProfile={userProfile}
                  onReOnboard={handleReOnboard}
                />
              )}
              {activeTab === "chat" && (
                <AssistantChat userProfile={userProfile} />
              )}
              {activeTab === "scanner" && (
                <Scanner 
                  onLogMeal={handleLogMealScanned} 
                  onReplaceCuratedMeal={handleReplaceCuratedMeal}
                  initialSwapTarget={scanReplacementTarget}
                  onClearSwapTarget={() => setScanReplacementTarget(null)}
                />
              )}
              {activeTab === "analytics" && (
                <Analytics />
              )}
              {activeTab === "settings" && (
                <ProfileSettings 
                  userProfile={userProfile}
                  onUpdateEmailSettings={handleUpdateEmailSettings}
                  onLogout={handleLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Elegant iPhone translucent bottom navigation dock */}
        <nav className="fixed bottom-5 inset-x-4 max-w-2xl mx-auto glass-panel rounded-3xl border border-glass-border/40 shadow-2xl p-2.5 sm:p-3 flex items-center justify-around z-40 transition-all backdrop-blur-md">
          {[
            { tab: "dashboard", icon: Home, label: "Home" },
            { tab: "mealplan", icon: CalendarRange, label: "Menu" },
            { tab: "chat", icon: MessageSquareCode, label: "AI Coach" },
            { tab: "scanner", icon: QrCode, label: "Lens" },
            { tab: "analytics", icon: TrendingUp, label: "Stats" },
            { tab: "settings", icon: Settings, label: "Profile" }
          ].map((item) => {
            const isActive = activeTab === item.tab;
            const IconComponent = item.icon;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className="flex flex-col items-center justify-center p-2 sm:p-2.5 relative cursor-pointer min-w-[48px] xs:min-w-[64px] group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-mecha-green/15 border border-mecha-neon/30 rounded-2xl"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <IconComponent className={`w-5 h-5 xs:w-6 xs:h-6 transition-all group-hover:scale-110 ${isActive ? 'text-mecha-neon drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'text-tea-mist/65 hover:text-white'}`} />
                <span className={`text-[8px] xs:text-[10px] font-mono uppercase tracking-tight xs:tracking-widest mt-1 ${isActive ? 'text-mecha-neon font-bold' : 'text-tea-mist/50'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-transparent">
      {/* Liquid Glass Background Blobs */}
      <div className="liquid-blob-1" />
      <div className="liquid-blob-2" />
      <div className="liquid-blob-3" />

      {/* Dynamic Content Wrapper */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        {renderContent()}
      </div>
    </div>
  );
}
