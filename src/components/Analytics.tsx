import React, { useState } from "react";
import { Flame, Droplet, Dumbbell, TrendingUp, Maximize2, Minimize2, Calendar, Sparkles, Cloud, Mail, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { MOCK_HISTORY_LOGS } from "../data";
import { sendGmailMessage } from "../lib/workspace";
import { getAccessToken, auth } from "../lib/firebase";

export default function Analytics() {
  const [maximizedBlock, setMaximizedBlock] = useState<string | null>(null);
  
  const [gmailLoading, setGmailLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const generateTextReport = () => {
    let report = `==================================================\n`;
    report += `         AAHAR AI - METABOLISM & WELLNESS REPORT \n`;
    report += `==================================================\n\n`;
    report += `Report Date: ${new Date().toLocaleDateString()}\n`;
    report += `Clinical Goal: Weight Loss / Deficit Management\n`;
    report += `Diet Preference: Indian Traditional\n\n`;
    report += `HISTORIC METRIC LOGS:\n`;
    report += `--------------------------------------------------\n`;
    report += `Date       | Calories (kcal) | Protein (g) | Carbs (g) | Fats (g) | Water (L)\n`;
    report += `--------------------------------------------------\n`;
    MOCK_HISTORY_LOGS.forEach(log => {
      report += `${log.date} | ${log.calories.toString().padEnd(15)} | ${log.protein.toString().padEnd(11)} | ${log.carbs.toString().padEnd(9)} | ${log.fat.toString().padEnd(8)} | ${log.water}\n`;
    });
    report += `--------------------------------------------------\n\n`;
    report += `Generated automatically by Aahar AI Indian Clinical Companion.\n`;
    return report;
  };

  const handleSendGmail = async () => {
    const token = await getAccessToken();
    if (!token || !auth.currentUser) {
      alert("Please sign in with Google first on the settings/auth screen to use Gmail.");
      return;
    }

    setGmailLoading(true);
    setToastMessage(null);

    try {
      const subject = "Aahar AI: Welcome to Your Indian Clinical Wellness Companion & Telemetry";
      const userEmail = auth.currentUser.email || "";
      const userName = auth.currentUser.displayName || "Aahar User";
      
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <!-- Brand Header -->
          <div style="background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #34d399;">Aahar AI</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #a7f3d0; font-family: monospace; text-transform: uppercase; letter-spacing: 1px;">Indian Traditional Clinical Companion</p>
          </div>
          
          <!-- Main Body Content -->
          <div style="padding: 28px 24px;">
            <p style="margin-top: 0; font-size: 16px; line-height: 1.6; color: #334155;">
              Dear <strong>${userName}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              Welcome to your secure clinical dashboard briefing. This email provides a clear breakdown of <strong>What Aahar AI is designed for</strong> and how it assists your daily metabolic calibration:
            </p>
            
            <!-- What is it for Section -->
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #065f46; font-weight: 700;">🌟 What is Aahar AI designed for?</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1e3a1e;">
                Aahar AI is a personalized, clinical nutrition intelligence assistant built to optimize your metabolism using the richness of traditional Indian ingredients. By combining clinical science with custom food swaps, we assist you in managing diabetes, high blood pressure, and weight control seamlessly.
              </p>
            </div>

            <!-- Core Pillars -->
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              Core Pillars of Your Digital Health Companion:
            </h3>
            <ul style="padding-left: 20px; margin: 0 0 24px 0; font-size: 14px; line-height: 1.7; color: #475569;">
              <li><strong>Regional Smart Food Swaps:</strong> Instantly replaces high-glycemic or oily regional foods (like fried samosas or refined rotis) with diabetic-friendly, protein-rich traditional alternatives.</li>
              <li><strong>Workspace Automation Routing:</strong> Integrates directly with your Google Workspace to compile daily automated menu guides via Gmail and synchronize therapeutic lifestyle tasks.</li>
              <li><strong>Micro & Macro Telemetry Tracking:</strong> Logs and visualizes essential health biomarkers, including sodium intake limits, calorie margins, fluid hydration levels, and metabolic weight trends.</li>
              <li><strong>Real-time Adaptive Diet Advice:</strong> Features an interactive medical-grade assistant chat to address local ingredient inquiries, meal pairings, and clinical menu questions on demand.</li>
            </ul>

            <!-- Telemetry Log Block -->
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #047857; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              Your Latest Metabolic Progress Briefing:
            </h3>
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; min-width: 450px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 12px 10px; text-align: left; font-size: 12px; color: #475569; font-weight: 600;">Date</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #475569; font-weight: 600;">Calories</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #475569; font-weight: 600;">Protein</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #475569; font-weight: 600;">Carbs</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #475569; font-weight: 600;">Fat</th>
                  </tr>
                </thead>
                <tbody>
                  ${MOCK_HISTORY_LOGS.map(log => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px; font-size: 13px; color: #1e293b; font-weight: 500;">${log.date}</td>
                      <td style="padding: 10px; text-align: right; font-size: 13px; font-weight: bold; color: #059669;">${log.calories} kcal</td>
                      <td style="padding: 10px; text-align: right; font-size: 13px; color: #334155;">${log.protein}g</td>
                      <td style="padding: 10px; text-align: right; font-size: 13px; color: #334155;">${log.carbs}g</td>
                      <td style="padding: 10px; text-align: right; font-size: 13px; color: #334155;">${log.fat}g</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Final Encouragement -->
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Use the dashboard to continuously fine-tune your nutrition targets, log active swaps, and check in with your metabolic trendlines regularly.
            </p>
          </div>

          <!-- Footer Disclaimer -->
          <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <p style="margin: 0 0 6px 0;">This report is intended strictly for clinical companion support and nutritional awareness tracking.</p>
            <p style="margin: 0;">Secured with secure Google Workspace Auth integration. Authorized user: ${userEmail}.</p>
          </div>
        </div>
      `;

      await sendGmailMessage(token, userEmail, subject, emailHtml);
      setToastMessage(`Clinical companion briefing and telemetry report dispatched to your Gmail address: ${userEmail}`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (e: any) {
      console.error(e);
      alert("Failed to send email. Please check permissions and try again.");
    } finally {
      setGmailLoading(false);
    }
  };

  // Formatting dates for clean chart viewing (e.g. "Jun 17")
  const formattedData = MOCK_HISTORY_LOGS.map(log => ({
    ...log,
    shortDate: new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }));

  // Reusable mini graph element
  const renderMiniChart = (type: string) => {
    switch (type) {
      case "calories":
        return (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorCals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px", fontSize: "10px" }} />
              <Area type="monotone" dataKey="calories" stroke="#00ff88" strokeWidth={2} fillOpacity={1} fill="url(#colorCals)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "macros":
        return (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={formattedData}>
              <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px", fontSize: "10px" }} />
              <Bar dataKey="protein" stackId="a" fill="#34d399" />
              <Bar dataKey="carbs" stackId="a" fill="#f59e0b" />
              <Bar dataKey="fat" stackId="a" fill="#f43f5e" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "water":
        return (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={formattedData}>
              <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px", fontSize: "10px" }} />
              <Bar dataKey="water" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "weight":
        return (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={formattedData}>
              <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px", fontSize: "10px" }} />
              <Line type="monotone" dataKey="weight" stroke="#a7f3d0" strokeWidth={2} dot={{ fill: '#00ff88', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Reusable expanded full-screen chart layout
  const renderMaximizedChart = (type: string) => {
    switch (type) {
      case "calories":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-mecha-neon bg-mecha-green/10 border border-mecha-neon/20 px-2.5 py-1 rounded-full">Target: 1300 kcal</span>
                <h3 className="text-xl font-bold font-display text-white mt-2">Calorie Intake Deficiency Balance</h3>
              </div>
              <Flame className="w-8 h-8 text-mecha-neon animate-pulse shrink-0" />
            </div>
            
            <div className="h-72 w-full mt-4 bg-black/30 rounded-2xl p-4 border border-glass-border/30">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData}>
                  <defs>
                    <linearGradient id="colorCalsMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.05)" />
                  <XAxis dataKey="shortDate" stroke="#82a896" fontSize={11} tickLine={false} />
                  <YAxis stroke="#82a896" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px" }} />
                  <Area type="monotone" dataKey="calories" stroke="#00ff88" strokeWidth={3} fillOpacity={1} fill="url(#colorCalsMax)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-tea-mist leading-relaxed font-sans">
              Calories consumed show a consistent daily pacing within the metabolic threshold of 1,300 kcal, inducing a safe 300 kcal deficit optimal for your active weight-loss goal.
            </p>
          </div>
        );
      case "macros":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 bg-emerald-950/20 border border-emerald-400/20 px-2.5 py-1 rounded-full">Optimal: 20% P | 50% C | 30% F</span>
                <h3 className="text-xl font-bold font-display text-white mt-2">Daily Macro Ratio Trends</h3>
              </div>
              <Dumbbell className="w-8 h-8 text-emerald-400 shrink-0" />
            </div>

            <div className="h-72 w-full mt-4 bg-black/30 rounded-2xl p-4 border border-glass-border/30">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.05)" />
                  <XAxis dataKey="shortDate" stroke="#82a896" fontSize={11} tickLine={false} />
                  <YAxis stroke="#82a896" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px" }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="protein" name="Protein (g)" fill="#34d399" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="carbs" name="Carbohydrates (g)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="fat" name="Fats (g)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-tea-mist leading-relaxed">
              Your protein absorption averages 54 grams daily, supporting structural cellular recovery. Carbs remain complex (oats, millets, whole-wheat chilla) ensuring steady glycogen stores without spike traps.
            </p>
          </div>
        );
      case "water":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-sky-400 bg-sky-950/20 border border-sky-400/20 px-2.5 py-1 rounded-full">Goal: 3.0 Liters</span>
                <h3 className="text-xl font-bold font-display text-white mt-2">Daily Fluid Hydration Tracker</h3>
              </div>
              <Droplet className="w-8 h-8 text-sky-400 shrink-0" />
            </div>

            <div className="h-72 w-full mt-4 bg-black/30 rounded-2xl p-4 border border-glass-border/30">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.05)" />
                  <XAxis dataKey="shortDate" stroke="#82a896" fontSize={11} tickLine={false} />
                  <YAxis stroke="#82a896" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px" }} />
                  <Bar dataKey="water" name="Water (Liters)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-tea-mist leading-relaxed">
              Hydration logs display excellent consistency. Reaching your 3-Liter goal helps support optimal digestive enzymes and active metabolic performance throughout North Indian warm spells.
            </p>
          </div>
        );
      case "weight":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-teal-300 bg-teal-950/20 border border-teal-300/20 px-2.5 py-1 rounded-full">Start: 78.5 kg • Current: 76.5 kg</span>
                <h3 className="text-xl font-bold font-display text-white mt-2">Weight Deficit Progression</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-300 shrink-0" />
            </div>

            <div className="h-72 w-full mt-4 bg-black/30 rounded-2xl p-4 border border-glass-border/30">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 136, 0.05)" />
                  <XAxis dataKey="shortDate" stroke="#82a896" fontSize={11} tickLine={false} />
                  <YAxis stroke="#82a896" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#06150f", border: "1px solid rgba(0, 255, 136, 0.25)", color: "#fff", borderRadius: "10px" }} />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#00ff88" strokeWidth={3} dot={{ fill: '#00ff88', r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-tea-mist leading-relaxed font-sans">
              Weight shows steady progress dropping from 78.5 kg to 76.5 kg in 10 days, maintaining muscle tissue due to high protein counts.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div id="analytics-page" className="space-y-6 pb-28">
      <div>
        <h2 className="text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          Metabolism Progress Analytics
        </h2>
        <p className="text-xs text-emerald-100 mt-1 font-mono uppercase tracking-wider drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]">
          Click any graph block to expand detailed telemetry trends
        </p>
      </div>

      {/* Workspace Actions Card */}
      <div className="glass-panel rounded-2xl p-4 border border-glass-border/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mecha-neon/15 border border-mecha-neon/25 flex items-center justify-center text-mecha-neon shrink-0">
            <Sparkles className="w-5 h-5 glow-glow" />
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-white font-bold">Cloud Actions & Workspace Report</h4>
            <p className="text-[11px] text-tea-mist leading-relaxed mt-0.5">Receive your clinical nutrition report directly in Gmail.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={handleSendGmail}
            disabled={gmailLoading}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/20 border border-emerald-400/20 hover:border-emerald-400/50 text-emerald-400 text-xs font-mono font-medium flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {gmailLoading ? (
              <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>{gmailLoading ? "Sending..." : "Send to Gmail"}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-mecha-green/15 border border-mecha-neon/30 text-mecha-neon text-xs font-mono rounded-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid of separate small blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* BLOCK 1: Calories */}
        <motion.div 
          onClick={() => setMaximizedBlock("calories")}
          className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-mecha-neon/30 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group h-52 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-tea-mist/60 uppercase tracking-widest">Active Intake</span>
              <h4 className="text-base font-bold text-white group-hover:text-mecha-neon transition-colors">Calorie Energy Trend</h4>
            </div>
            <Maximize2 className="w-4 h-4 text-tea-mist/40 group-hover:text-white transition-colors" />
          </div>
          
          <div className="h-28 flex items-end">
            {renderMiniChart("calories")}
          </div>
        </motion.div>

        {/* BLOCK 2: Macros */}
        <motion.div 
          onClick={() => setMaximizedBlock("macros")}
          className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-mecha-neon/30 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group h-52 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-tea-mist/60 uppercase tracking-widest">Nutrients Ratio</span>
              <h4 className="text-base font-bold text-white group-hover:text-mecha-neon transition-colors">Protein / Carbs / Fats</h4>
            </div>
            <Maximize2 className="w-4 h-4 text-tea-mist/40 group-hover:text-white transition-colors" />
          </div>

          <div className="h-28 flex items-end">
            {renderMiniChart("macros")}
          </div>
        </motion.div>

        {/* BLOCK 3: Hydration */}
        <motion.div 
          onClick={() => setMaximizedBlock("water")}
          className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-mecha-neon/30 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group h-52 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-tea-mist/60 uppercase tracking-widest">Fluid Balance</span>
              <h4 className="text-base font-bold text-white group-hover:text-mecha-neon transition-colors">Water History</h4>
            </div>
            <Maximize2 className="w-4 h-4 text-tea-mist/40 group-hover:text-white transition-colors" />
          </div>

          <div className="h-28 flex items-end">
            {renderMiniChart("water")}
          </div>
        </motion.div>

        {/* BLOCK 4: Weight */}
        <motion.div 
          onClick={() => setMaximizedBlock("weight")}
          className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-mecha-neon/30 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group h-52 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-tea-mist/60 uppercase tracking-widest">Progress Metrics</span>
              <h4 className="text-base font-bold text-white group-hover:text-mecha-neon transition-colors">Weight Progress (kg)</h4>
            </div>
            <Maximize2 className="w-4 h-4 text-tea-mist/40 group-hover:text-white transition-colors" />
          </div>

          <div className="h-28 flex items-end">
            {renderMiniChart("weight")}
          </div>
        </motion.div>
      </div>

      {/* Maximized Overlay view */}
      <AnimatePresence>
        {maximizedBlock && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel-heavy rounded-3xl p-6 max-w-2xl w-full border border-mecha-neon/20 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <button 
                onClick={() => setMaximizedBlock(null)}
                className="absolute right-4 top-4 p-2 rounded-xl bg-black/40 border border-glass-border text-tea-mist hover:text-white hover:border-mecha-neon/40 transition-all cursor-pointer flex items-center gap-1 text-xs"
              >
                <Minimize2 className="w-4 h-4" />
                Close View
              </button>

              {renderMaximizedChart(maximizedBlock)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
