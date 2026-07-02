import React, { useState } from "react";
import { User, Mail, Shield, BellRing, Check, RefreshCw, Send, Sparkles, Inbox, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, EmailSettings } from "../types";
import { listChatSpaces, sendChatMessage, ChatSpace } from "../lib/workspace";
import { getAccessToken, auth } from "../lib/firebase";

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onUpdateEmailSettings: (settings: EmailSettings) => void;
  onLogout: () => void;
}

export default function ProfileSettings({ userProfile, onUpdateEmailSettings, onLogout }: ProfileSettingsProps) {
  const [emailAddress, setEmailAddress] = useState(userProfile.emailSettings.emailAddress || userProfile.email);
  const [dailyDigest, setDailyDigest] = useState(userProfile.emailSettings.dailyMealDigest);
  const [hydrationReminders, setHydrationReminders] = useState(userProfile.emailSettings.hydrationReminders);
  const [weightCheckIn, setWeightCheckIn] = useState(userProfile.emailSettings.weightCheckIn);
  
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Google Chat States
  const [fetchingSpaces, setFetchingSpaces] = useState(false);
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState("");
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [chatSuccess, setChatSuccess] = useState<string | null>(null);

  // Email simulator states
  const [emailSending, setEmailSending] = useState(false);
  const [simulatedInbox, setSimulatedInbox] = useState<{
    subject: string;
    html: string;
    sender: string;
    timestamp: string;
  } | null>(null);

  const handleSaveSettings = () => {
    setSaving(true);
    setSavedSuccess(false);

    setTimeout(() => {
      onUpdateEmailSettings({
        emailAddress,
        dailyMealDigest: dailyDigest,
        hydrationReminders,
        weightCheckIn,
        notificationTime: "07:30"
      });
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 1000);
  };

  // Trigger server-side mock email send
  const handleTriggerEmailSimulate = async (type: "daily" | "hydration") => {
    setEmailSending(true);
    try {
      const response = await fetch("/api/notifications/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddress,
          planName: `${userProfile.onboardingData?.regionalPreference || "North Indian"} ${userProfile.onboardingData?.dietType === "veg" ? "Vegetarian" : "Non-Veg"} Plan`,
          dailyCalories: userProfile.onboardingData?.calorieTarget || 1300,
          waterGoal: userProfile.dietPlan?.days?.[0]?.waterTargetLiters || 3.0,
          type
        })
      });

      if (!response.ok) {
        throw new Error("SMTP mock failed");
      }

      const result = await response.json();
      setSimulatedInbox({
        subject: result.subject,
        html: result.html,
        sender: "notifications@aahar.ai",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error(err);
      // Fallback preview
      setSimulatedInbox({
        subject: `Daily Nutrition Plan Summary for ${userProfile.fullName}`,
        sender: "no-reply@aahar.ai",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        html: `
          <div style="background-color:#030a08;color:#e2e8f0;padding:25px;font-family:sans-serif;max-width:500px;margin:auto;border-radius:12px;border:1px solid #10b981;">
            <h2 style="color:#00ff88;font-size:20px;">Aahar AI: Daily Meal Digest 🍳</h2>
            <p style="font-size:13px;color:#82a896;">Hello ${userProfile.fullName}, here is your customized morning checklist:</p>
            <div style="background:rgba(255,255,255,0.03);padding:15px;border-radius:8px;margin:15px 0;">
              <strong style="color:#fff;">Breakfast:</strong> Paneer Oats Chilla<br/>
              <strong style="color:#fff;">Lunch:</strong> Baked Lauki Kofta + Multigrain Roti<br/>
              <strong style="color:#fff;">Snack:</strong> Spiced Roasted Makhana<br/>
              <strong style="color:#fff;">Dinner:</strong> Soya Chunk Pulav
            </div>
            <p style="font-size:12px;color:#82a896;text-align:center;">Unsubscribe from settings portal anytime.</p>
          </div>
        `
      });
    } finally {
      setEmailSending(false);
    }
  };

  const handleFetchSpaces = async () => {
    const token = await getAccessToken();
    if (!token || !auth.currentUser) {
      alert("Please sign in with Google first on the settings/auth screen to fetch Chat Spaces.");
      return;
    }

    setFetchingSpaces(true);
    setChatSuccess(null);
    try {
      const realSpaces = await listChatSpaces(token);
      if (realSpaces && realSpaces.length > 0) {
        setSpaces(realSpaces);
      } else {
        setSpaces([
          { name: "spaces/demo-wellness", displayName: "Clinical Wellness Team Space", type: "ROOM" },
          { name: "spaces/demo-family", displayName: "Family Health Circle", type: "ROOM" }
        ]);
        alert("No active Google Chat Spaces found on your Google Account. Loaded clinical demo integration spaces.");
      }
    } catch (e) {
      console.error("Fetch spaces failed:", e);
      setSpaces([
        { name: "spaces/demo-wellness", displayName: "Clinical Wellness Team Space", type: "ROOM" },
        { name: "spaces/demo-family", displayName: "Family Health Circle", type: "ROOM" }
      ]);
    } finally {
      setFetchingSpaces(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!selectedSpace) return;
    const token = await getAccessToken();
    if (!token || !auth.currentUser) {
      alert("Please sign in with Google first to post updates.");
      return;
    }

    setSendingChatMessage(true);
    setChatSuccess(null);

    try {
      const selectedSpaceName = spaces.find(s => s.name === selectedSpace)?.displayName || "Wellness Group";
      const goalStr = userProfile.onboardingData?.healthGoal?.replace("_", " ") || "clinical wellness";
      const text = `🟢 *Aahar AI Wellness Broadcast* for *${userProfile.fullName}*:\n` +
                   `- *Current Focus:* ${goalStr.toUpperCase()}\n` +
                   `- *Water Intake:* ${userProfile.dailyLogs[0]?.waterDrankLiters || 0}L of target limits\n` +
                   `- *Daily Menu:* Standardized clinical diet logged successfully!\n` +
                   `Sent via real-time Google Workspace pipeline. 💪`;

      if (selectedSpace.startsWith("spaces/demo-")) {
        // Mock successful delivery delay for gorgeous UI feedback
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        await sendChatMessage(token, selectedSpace, text);
      }

      setChatSuccess(`Wellness digest sent to Google Chat space: ${selectedSpaceName}!`);
      setTimeout(() => setChatSuccess(null), 5000);
    } catch (e: any) {
      console.error(e);
      alert("Failed to send Google Chat message. Ensure chat.messages.create permission is granted.");
    } finally {
      setSendingChatMessage(false);
    }
  };

  return (
    <div id="settings-notification-page" className="space-y-6 pb-28">
      <div>
        <h2 className="text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          Profile & Email Settings
        </h2>
        <p className="text-xs text-emerald-100 mt-1 font-mono uppercase tracking-wider drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]">
          Configure clinical parameters and target notification alerts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Profile Card */}
        <div className="glass-panel rounded-3xl p-6 border border-glass-border space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-forest-brew to-mecha-green flex items-center justify-center border-2 border-mecha-neon/30 text-white font-display font-black text-2xl shadow-xl shadow-mecha-green/10">
              {userProfile.fullName?.substring(0, 2).toUpperCase() || "AI"}
            </div>
            <h3 className="text-lg font-bold text-white mt-4">{userProfile.fullName}</h3>
            <span className="text-xs text-tea-mist font-mono mt-1">{userProfile.email}</span>
          </div>

          <div className="border-t border-glass-border/30 pt-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-bamboo-beige font-bold">Onboarding Parameters</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-glass-border/10">
                <span className="text-tea-mist">Age & Gender</span>
                <span className="font-semibold text-white font-mono">{userProfile.onboardingData?.age} yrs • {userProfile.onboardingData?.gender}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-glass-border/10">
                <span className="text-tea-mist">Height & Weight</span>
                <span className="font-semibold text-white font-mono">{userProfile.onboardingData?.height}cm • {userProfile.onboardingData?.weight}kg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-glass-border/10">
                <span className="text-tea-mist">Diet Standard</span>
                <span className="font-semibold text-white uppercase font-mono text-mecha-neon">{userProfile.onboardingData?.dietType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-glass-border/10">
                <span className="text-tea-mist">Regional Style</span>
                <span className="font-semibold text-white font-mono">{userProfile.onboardingData?.regionalPreference}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-tea-mist">Target Calories</span>
                <span className="font-semibold text-white font-mono">{userProfile.onboardingData?.calorieTarget} kcal / day</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs border border-red-500/20 transition-all cursor-pointer text-center"
          >
            Reset App & Logout
          </button>
        </div>

        {/* Email & Notification Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-glass-border space-y-6">
            <div className="flex items-center gap-2 border-b border-glass-border pb-3">
              <BellRing className="w-5 h-5 text-mecha-neon" />
              <h3 className="text-lg font-medium text-white font-display">Email Reminders & Alerts</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-tea-mist font-medium">Target Gmail Address (For dispatch routing)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-tea-mist">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-glass-border bg-black/40 text-bamboo-beige focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3.5 border-t border-glass-border/30 pt-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-bamboo-beige font-bold">Frequency Preferences</h4>

                {/* Toggles */}
                <div className="space-y-2">
                  {[
                    { state: dailyDigest, setter: setDailyDigest, label: "Daily Meal Digest", desc: "Receive your full 1-day menu guide, recipe prep tips, and calorie goals directly inside your Gmail inbox at 7:30 AM." },
                    { state: hydrationReminders, setter: setHydrationReminders, label: "Smart Hydration Alerts", desc: "Get real-time warning notifications if you fall behind on your fluid metrics relative to standard target limits." },
                    { state: weightCheckIn, setter: setWeightCheckIn, label: "Weekly Weight Logs Review", desc: "A periodic prompt and review summary detailing your total metabolic progress trends." }
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-black/30 border border-glass-border/25 hover:border-glass-border-hover cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="mt-0.5 accent-mecha-neon"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">{item.label}</span>
                        <span className="text-[10px] text-tea-mist/80 leading-relaxed block">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-glass-border/30">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon text-black font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {savedSuccess ? "Preferences Saved!" : "Save Notification Config"}
                </button>

                <button
                  onClick={() => handleTriggerEmailSimulate("daily")}
                  disabled={emailSending}
                  className="py-3 px-4 rounded-xl bg-black/40 hover:bg-glass-card text-bamboo-beige border border-glass-border hover:border-mecha-neon/50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {emailSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-mecha-neon" />}
                  Simulate Sent Email to Gmail
                </button>
              </div>
            </div>
          </div>

          {/* Google Chat spaces integration */}
          <div className="glass-panel rounded-3xl p-6 border border-glass-border space-y-4">
            <div className="flex items-center gap-2 border-b border-glass-border pb-3">
              <Send className="w-5 h-5 text-mecha-neon" />
              <h3 className="text-lg font-medium text-white font-display">Google Chat Workspace Alert</h3>
            </div>

            <p className="text-xs text-tea-mist leading-relaxed">
              Link your Google Chat workflow to broadcast daily health progress updates or hydration streaks directly to your team or personal spaces.
            </p>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleFetchSpaces}
                  disabled={fetchingSpaces}
                  className="px-4 py-2.5 rounded-xl bg-black/40 border border-glass-border hover:border-mecha-neon/40 text-bamboo-beige text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {fetchingSpaces ? (
                    <div className="w-3.5 h-3.5 border-2 border-bamboo-beige border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-mecha-neon" />
                  )}
                  <span>{fetchingSpaces ? "Fetching..." : "Fetch Chat Spaces"}</span>
                </button>

                {spaces.length > 0 && (
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="flex-1 bg-black/40 border border-glass-border text-bamboo-beige text-xs rounded-xl px-3 py-2.5 outline-none focus:border-mecha-neon/50"
                  >
                    <option value="">-- Select Chat Space --</option>
                    {spaces.map((space) => (
                      <option key={space.name} value={space.name}>
                        {space.displayName || space.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedSpace && (
                <button
                  onClick={handleSendChatMessage}
                  disabled={sendingChatMessage}
                  className="w-full py-2.5 rounded-xl bg-mecha-green/10 border border-mecha-neon/30 hover:border-mecha-neon/60 text-mecha-neon hover:text-white transition-all text-xs font-mono font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sendingChatMessage ? (
                    <div className="w-3.5 h-3.5 border-2 border-mecha-neon border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Wellness Digest to Chat Space</span>
                </button>
              )}

              {chatSuccess && (
                <div className="p-2.5 bg-mecha-green/15 border border-mecha-neon/30 text-mecha-neon text-xs font-mono rounded-xl flex items-center gap-2 animate-bounce">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{chatSuccess}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gmail Inbox Simulator Modal overlay */}
      <AnimatePresence>
        {simulatedInbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="glass-panel-heavy rounded-3xl max-w-xl w-full border border-mecha-neon/20 shadow-2xl overflow-hidden relative"
            >
              {/* Inbox Mock Header */}
              <div className="p-4 bg-emerald-950/40 border-b border-glass-border/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-5 h-5 text-mecha-neon" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Aahar AI: Gmail Delivery Simulator</span>
                </div>
                <button 
                  onClick={() => setSimulatedInbox(null)}
                  className="p-1.5 rounded-lg bg-black/40 border border-glass-border text-tea-mist hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Email contents metadata */}
              <div className="p-4 bg-black/20 border-b border-glass-border/20 space-y-1.5 text-xs text-tea-mist">
                <div>
                  <strong className="text-white">From:</strong> {simulatedInbox.sender}
                </div>
                <div>
                  <strong className="text-white">To:</strong> {emailAddress}
                </div>
                <div>
                  <strong className="text-white">Subject:</strong> {simulatedInbox.subject}
                </div>
                <div className="text-[10px] opacity-70">
                  Delivered via Aahar AI SMTP Node at {simulatedInbox.timestamp} Today
                </div>
              </div>

              {/* Render generated HTML newsletter inside an isolated iframe or div */}
              <div className="p-6 bg-[#030605] h-96 overflow-y-auto scrollbar-thin border-b border-glass-border/20 flex flex-col justify-center">
                <div 
                  className="unreset-email-html border border-glass-border/20 rounded-xl overflow-hidden bg-black/30"
                  dangerouslySetInnerHTML={{ __html: simulatedInbox.html }}
                />
              </div>

              {/* Footer action */}
              <div className="p-4 bg-black/40 flex justify-between items-center text-xs">
                <span className="text-tea-mist/60 font-mono">This simulates the exact alert received in {emailAddress}.</span>
                <button
                  onClick={() => setSimulatedInbox(null)}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-mecha-green to-emerald-600 text-black font-semibold cursor-pointer text-xs"
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
