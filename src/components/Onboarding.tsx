import React, { useState } from "react";
import { 
  User, 
  Activity, 
  Heart, 
  ShieldAlert, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Compass, 
  Scale, 
  CheckCircle2, 
  Zap, 
  RefreshCw 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { OnboardingData, DietPlan } from "../types";

interface OnboardingProps {
  onComplete: (data: OnboardingData, plan: DietPlan) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default state for onboarding questionnaire
  const [formData, setFormData] = useState<OnboardingData>({
    age: 28,
    gender: "male",
    height: 172,
    weight: 68,
    activityLevel: "moderately_active",
    dietType: "veg",
    exclusions: [],
    medicalConditions: [],
    regionalPreference: "North Indian",
    healthGoal: "weight_loss"
  });

  const tips = [
    "Formulating optimal macronutrient split based on Mifflin-St Jeor formula...",
    "Curating authentic regional Indian recipe options...",
    "Applying clinical nutrition exclusions for safety and health...",
    "Configuring customized hydration goals and metabolic targets...",
    "Polishing final clinical diet plan recommendations..."
  ];

  // Rotate tips during loading
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % tips.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleExclusion = (tag: string) => {
    const current = [...formData.exclusions];
    if (current.includes(tag)) {
      updateField("exclusions", current.filter((x) => x !== tag));
    } else {
      updateField("exclusions", [...current, tag]);
    }
  };

  const handleToggleCondition = (tag: string) => {
    const current = [...formData.medicalConditions];
    if (current.includes(tag)) {
      updateField("medicalConditions", current.filter((x) => x !== tag));
    } else {
      updateField("medicalConditions", [...current, tag]);
    }
  };

  const nextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.age || formData.age < 12 || formData.age > 100) {
        setErrorMsg("Please enter a valid age between 12 and 100.");
        return;
      }
      if (!formData.height || formData.height < 100 || formData.height > 250) {
        setErrorMsg("Please enter a valid height (100 - 250 cm).");
        return;
      }
      if (!formData.weight || formData.weight < 30 || formData.weight > 250) {
        setErrorMsg("Please enter a valid weight (30 - 250 kg).");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep((prev) => prev - 1);
  };

  const handleFormSubmit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/diet/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingData: formData })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate diet plan. Please verify your connection.");
      }

      const plan: DietPlan = await response.json();
      onComplete(formData, plan);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during diet plan generation. Please try again.");
      setLoading(false);
    }
  };

  // Step 1: Vital physical metrics
  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 mb-2 text-mecha-neon font-mono text-xs uppercase tracking-widest">
        <User className="w-4 h-4 animate-pulse" /> Step 1: Vital Physical Metrics
      </div>
      <h3 className="text-xl font-display font-black text-white leading-tight">
        Tell us about your physical profile
      </h3>
      <p className="text-xs text-tea-mist leading-relaxed">
        This allows Aahar AI to calculate your Basal Metabolic Rate (BMR) and daily clinical energy requirements accurately.
      </p>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Age Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist">Age (Years)</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => updateField("age", parseInt(e.target.value) || 0)}
            className="w-full glass-input px-4 py-3 rounded-xl text-xs bg-black/45 border border-glass-border/40 focus:border-mecha-neon text-white focus:outline-none"
            placeholder="e.g., 28"
            min="12"
            max="100"
          />
        </div>

        {/* Gender Choice */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updateField("gender", g)}
                className={`px-3 py-3 rounded-xl border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  formData.gender === g
                    ? "bg-mecha-green/15 border-mecha-neon text-mecha-neon"
                    : "bg-black/25 border-glass-border/30 text-tea-mist hover:border-glass-border hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Height Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist">Height (cm)</label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) => updateField("height", parseInt(e.target.value) || 0)}
            className="w-full glass-input px-4 py-3 rounded-xl text-xs bg-black/45 border border-glass-border/40 focus:border-mecha-neon text-white focus:outline-none"
            placeholder="e.g., 172"
          />
        </div>

        {/* Weight Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist">Weight (kg)</label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => updateField("weight", parseInt(e.target.value) || 0)}
            className="w-full glass-input px-4 py-3 rounded-xl text-xs bg-black/45 border border-glass-border/40 focus:border-mecha-neon text-white focus:outline-none"
            placeholder="e.g., 68"
          />
        </div>
      </div>
    </motion.div>
  );

  // Step 2: Taste Preferences & Culinary region
  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 mb-2 text-mecha-neon font-mono text-xs uppercase tracking-widest">
        <Compass className="w-4 h-4" /> Step 2: Taste & Cuisine Preferences
      </div>
      <h3 className="text-xl font-display font-black text-white leading-tight">
        Culinary Preferences & Habits
      </h3>
      <p className="text-xs text-tea-mist leading-relaxed">
        We calibrate Indian diet recommendations based on your choice of meal type and traditional regional styles.
      </p>

      <div className="space-y-4 pt-1">
        {/* Diet Type */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist block">Dietary Identity</label>
          <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
            {[
              { id: 'veg', label: 'Veg' },
              { id: 'eggetarian', label: 'Eggetarian' },
              { id: 'non_veg', label: 'Non-Veg' },
              { id: 'vegan', label: 'Vegan' }
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => updateField("dietType", d.id)}
                className={`px-2.5 py-3 rounded-xl border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  formData.dietType === d.id
                    ? "bg-mecha-green/15 border-mecha-neon text-mecha-neon shadow-lg"
                    : "bg-black/25 border-glass-border/30 text-tea-mist hover:border-glass-border hover:text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Regional Choice */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist block font-bold">Regional Cuisine Flavor</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "North Indian",
              "South Indian",
              "Maharashtrian",
              "Bengali",
              "Gujarati",
              "Punjabi"
            ].map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => updateField("regionalPreference", reg)}
                className={`px-3 py-2.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  formData.regionalPreference === reg
                    ? "bg-mecha-green/15 border-mecha-neon text-mecha-neon"
                    : "bg-black/25 border-glass-border/30 text-tea-mist hover:border-glass-border hover:text-white"
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Step 3: Medical profile & Exclusions
  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 mb-2 text-mecha-neon font-mono text-xs uppercase tracking-widest">
        <ShieldAlert className="w-4 h-4" /> Step 3: Clinical Health & Safety
      </div>
      <h3 className="text-xl font-display font-black text-white leading-tight">
        Allergies & Medical Conditions
      </h3>
      <p className="text-xs text-tea-mist leading-relaxed">
        Aahar AI adapts menus to prevent chronic inflammation, managing glycemic spikes and avoiding ingredients you exclude.
      </p>

      <div className="space-y-4">
        {/* Conditions */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist block">Medical Focus / Issues</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "Diabetes", label: "Diabetes (Low GI)" },
              { id: "Hypertension", label: "Hypertension" },
              { id: "Thyroid", label: "Thyroid Balance" },
              { id: "High Cholesterol", label: "High Cholesterol" },
              { id: "Acid Reflux", label: "Acid Reflux" },
              { id: "Gout", label: "High Uric Acid / Gout" }
            ].map((med) => {
              const active = formData.medicalConditions.includes(med.id);
              return (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => handleToggleCondition(med.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-mono transition-all cursor-pointer ${
                    active
                      ? "bg-rose-500/10 border-rose-500 text-rose-400"
                      : "bg-black/25 border-glass-border/30 text-tea-mist hover:border-glass-border hover:text-white"
                  }`}
                >
                  {med.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exclusions */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist block">Exclusions / Allergens</label>
          <div className="flex flex-wrap gap-2">
            {[
              "Gluten",
              "Nuts",
              "Dairy",
              "Soy",
              "Shellfish",
              "Beef",
              "Pork",
              "Mushroom"
            ].map((tag) => {
              const active = formData.exclusions.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleExclusion(tag)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono transition-all cursor-pointer ${
                    active
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                      : "bg-black/25 border-glass-border/30 text-tea-mist hover:border-glass-border hover:text-white"
                  }`}
                >
                  {active ? `No ${tag}` : `Exclude ${tag}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Step 4: Health Goal & Daily Activity Level
  const renderStep4 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 mb-2 text-mecha-neon font-mono text-xs uppercase tracking-widest">
        <Scale className="w-4 h-4" /> Step 4: Health Goals & Active Split
      </div>
      <h3 className="text-xl font-display font-black text-white leading-tight">
        Define your metabolic objective
      </h3>
      <p className="text-xs text-tea-mist leading-relaxed">
        Let's finalize your calories by identifying your activity levels and health objectives.
      </p>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4 pt-1">
        {/* Goal */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist block">Core Objective</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'weight_loss', label: 'Weight Loss' },
              { id: 'weight_gain', label: 'Healthy Weight Gain' },
              { id: 'muscle_building', label: 'Muscle Building' },
              { id: 'maintain', label: 'Maintain & Optimize' }
            ].map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => updateField("healthGoal", goal.id)}
                className={`px-3 py-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                  formData.healthGoal === goal.id
                    ? "bg-mecha-green/15 border-mecha-neon text-mecha-neon"
                    : "bg-black/25 border-glass-border/30 text-tea-mist hover:border-glass-border hover:text-white"
                }`}
              >
                <span>{goal.label}</span>
                {formData.healthGoal === goal.id && <CheckCircle2 className="w-4 h-4 shrink-0 text-mecha-neon" />}
              </button>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-wider text-tea-mist block">Daily Activity Level</label>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            {[
              { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
              { id: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days' },
              { id: 'moderately_active', label: 'Moderately Active', desc: 'Moderate activity 3-5 days' },
              { id: 'very_active', label: 'Very Active', desc: 'Athletic, high sports split' }
            ].map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => updateField("activityLevel", act.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  formData.activityLevel === act.id
                    ? "bg-mecha-green/15 border-mecha-neon text-mecha-neon"
                    : "bg-black/25 border-glass-border/30 text-tea-mist hover:border-glass-border hover:text-white"
                }`}
              >
                <span className="text-[11px] font-bold font-mono uppercase tracking-wider">{act.label}</span>
                <span className="text-[9px] text-tea-mist/70">{act.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 relative">
      
      {/* Background decoration flares */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-mecha-green/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl glass-panel rounded-3xl border border-glass-border/40 overflow-hidden shadow-2xl bg-black/35 relative">
        
        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center space-y-6"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-glass-border/40" />
                <div className="absolute inset-0 rounded-full border-4 border-t-mecha-neon border-r-mecha-neon animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-mecha-neon">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-xs">
                <h3 className="font-display font-black text-white text-base">Aahar AI Nutrition Engine</h3>
                <p className="text-[11px] font-mono text-mecha-neon uppercase tracking-widest flex items-center justify-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-mecha-neon" /> Generating Diet Matrix
                </p>
                
                {/* Rotating tip */}
                <motion.p 
                  key={loadingTipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-tea-mist text-xs leading-relaxed mt-4 italic min-h-[40px]"
                >
                  "{tips[loadingTipIndex]}"
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Header Progress Bar */}
        <div className="bg-black/30 border-b border-glass-border/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-mecha-neon animate-pulse" />
            <span className="text-xs font-mono text-white tracking-widest uppercase font-bold">Aahar Clinical Onboarding</span>
          </div>
          <span className="text-xs font-mono text-mecha-neon">
            0{step} / 04
          </span>
        </div>
        
        <div className="w-full bg-black/60 h-1">
          <div 
            className="bg-gradient-to-r from-mecha-green to-emerald-400 h-1 transition-all duration-300" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form panel bodies */}
        <div className="p-6 sm:p-8 min-h-[380px]">
          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </AnimatePresence>
        </div>

        {/* Wizard Footer controls */}
        <div className="bg-black/30 border-t border-glass-border/30 px-6 py-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/40 border border-glass-border/30 hover:border-glass-border text-tea-mist hover:text-white transition-all text-xs font-mono uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon text-black font-mono font-bold uppercase text-xs tracking-wider transition-all cursor-pointer active:scale-95 shadow-md ml-auto"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFormSubmit}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon text-black font-mono font-bold uppercase text-xs tracking-widest transition-all cursor-pointer active:scale-95 shadow-lg shadow-mecha-green/10 ml-auto"
            >
              Formulate Diet Plan <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
