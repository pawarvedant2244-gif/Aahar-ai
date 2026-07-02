import React, { useState, useEffect } from "react";
import { ListTodo, CheckCircle2, RefreshCw, Plus, Check, Sparkles, AlertCircle, Calendar, Mail } from "lucide-react";
import { motion } from "motion/react";
import { getAccessToken, auth, googleSignIn } from "../lib/firebase";
import { listTaskLists, createGoogleTask, sendGmailMessage, TaskList, TaskPayload } from "../lib/workspace";
import { UserProfile } from "../types";

interface GoogleTasksWidgetProps {
  userProfile: UserProfile;
}

export default function GoogleTasksWidget({ userProfile }: GoogleTasksWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sendEmailCopy, setSendEmailCopy] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      if (token && auth.currentUser) {
        setIsLinked(true);
        // Load task lists automatically
        handleFetchLists(token);
      }
    };
    checkAuth();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setIsLinked(true);
        await handleFetchLists(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to connect Google Account. Ensure popup blocker is disabled.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLists = async (token: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const lists = await listTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0) {
        // Default to first list
        setSelectedListId(lists[0].id);
      }
    } catch (err: any) {
      console.error(err);
      // Fallback fallback lists for clinical preview demo
      setTaskLists([
        { id: "@default", title: "My Tasks (Default)" },
        { id: "clinical-wellness", title: "Clinical Wellness Goals" }
      ]);
      setSelectedListId("@default");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToTasks = async (type: 'meals' | 'water' | 'weight') => {
    const token = await getAccessToken();
    if (!token || !selectedListId) {
      setErrorMsg("Please link your Google account and select a task list.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSyncStatus(null);

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const tasksToCreate: TaskPayload[] = [];

      if (type === 'meals') {
        const currentDayPlan = userProfile.dietPlan?.days?.[0];
        if (currentDayPlan) {
          tasksToCreate.push({
            title: `☀️ [Aahar AI] Eat Breakfast: ${currentDayPlan.breakfast.name}`,
            notes: `Portion: ${currentDayPlan.breakfast.portionSize} | Calories: ${currentDayPlan.breakfast.calories}kcal\nMeal plan created by Aahar AI Companion.`,
            due: `${todayStr}T08:30:00.000Z`
          });
          tasksToCreate.push({
            title: `🍱 [Aahar AI] Eat Lunch: ${currentDayPlan.lunch.name}`,
            notes: `Portion: ${currentDayPlan.lunch.portionSize} | Calories: ${currentDayPlan.lunch.calories}kcal\nEnsure traditional clinical timing.`,
            due: `${todayStr}T13:15:00.000Z`
          });
          tasksToCreate.push({
            title: `☕ [Aahar AI] Evening Snack: ${currentDayPlan.snacks.name}`,
            notes: `Portion: ${currentDayPlan.snacks.portionSize} | Calories: ${currentDayPlan.snacks.calories}kcal\nStay energized.`,
            due: `${todayStr}T17:30:00.000Z`
          });
          tasksToCreate.push({
            title: `🥗 [Aahar AI] Eat Dinner: ${currentDayPlan.dinner.name}`,
            notes: `Portion: ${currentDayPlan.dinner.portionSize} | Calories: ${currentDayPlan.dinner.calories}kcal\nFinish dinner at least 2 hours before bed.`,
            due: `${todayStr}T20:30:00.000Z`
          });
        } else {
          tasksToCreate.push({
            title: `🥗 [Aahar AI] Review & Eat Today's Diet Recipes`,
            notes: `Keep macros in clinical range.`,
            due: `${todayStr}T12:00:00.000Z`
          });
        }
      } else if (type === 'water') {
        const targetLiters = userProfile.dietPlan?.days?.[0]?.waterTargetLiters || 3.0;
        tasksToCreate.push({
          title: `💧 [Aahar AI] Hydration Goal: Drink ${targetLiters} Liters of water`,
          notes: `Track continuously to avoid thyroid fatigue and boost recovery metrics.`,
          due: `${todayStr}T21:00:00.000Z`
        });
      } else if (type === 'weight') {
        tasksToCreate.push({
          title: `⚖️ [Aahar AI] Fasting Weight Check-in`,
          notes: `Measure weight in morning before meals to track exact metabolic velocity.`,
          due: `${todayStr}T07:00:00.000Z`
        });
      }

      for (const t of tasksToCreate) {
        await createGoogleTask(token, selectedListId, t);
      }

      // Send email copy of tasks if requested
      if (sendEmailCopy) {
        const userEmail = auth.currentUser?.email || userProfile.email;
        if (userEmail) {
          let emailSubject = "";
          let emailBodyHtml = "";

          if (type === 'meals') {
            emailSubject = "Aahar AI: Daily Diet Timings Synced to Google Tasks";
            const currentDayPlan = userProfile.dietPlan?.days?.[0];
            emailBodyHtml = `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #16a34a; padding-bottom: 15px;">
                  <h1 style="color: #16a34a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Aahar AI Companion</h1>
                  <p style="color: #4b5563; font-size: 14px; margin: 5px 0 0 0; font-family: monospace;">CLINICAL NUTRITION HUB</p>
                </div>
                
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                  <h3 style="color: #166534; margin: 0 0 6px 0; font-size: 16px; font-weight: bold;">✓ Google Tasks Sync Complete</h3>
                  <p style="color: #14532d; font-size: 13px; margin: 0; line-height: 1.5;">
                    Your wellness diet tasks have been synchronized to list: <strong>${taskLists.find(l => l.id === selectedListId)?.title || "Default"}</strong>.
                  </p>
                </div>

                <h3 style="color: #1f2937; margin-bottom: 12px; font-size: 15px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Today's Synchronized Tasks</h3>
                
                ${currentDayPlan ? `
                  <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #f8fafc;">
                    <div style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                      <span style="color: #16a34a; font-weight: bold; font-size: 12px; text-transform: uppercase;">☀️ Breakfast (08:30 AM)</span>
                      <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 4px;">${currentDayPlan.breakfast.name}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Portion: ${currentDayPlan.breakfast.portionSize} | Calories: ${currentDayPlan.breakfast.calories} kcal</div>
                    </div>
                    
                    <div style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                      <span style="color: #16a34a; font-weight: bold; font-size: 12px; text-transform: uppercase;">🍱 Lunch (01:15 PM)</span>
                      <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 4px;">${currentDayPlan.lunch.name}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Portion: ${currentDayPlan.lunch.portionSize} | Calories: ${currentDayPlan.lunch.calories} kcal</div>
                    </div>
                    
                    <div style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                      <span style="color: #16a34a; font-weight: bold; font-size: 12px; text-transform: uppercase;">☕ Evening Snack (05:30 PM)</span>
                      <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 4px;">${currentDayPlan.snacks.name}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Portion: ${currentDayPlan.snacks.portionSize} | Calories: ${currentDayPlan.snacks.calories} kcal</div>
                    </div>
                    
                    <div style="padding: 12px 15px; background-color: #ffffff;">
                      <span style="color: #16a34a; font-weight: bold; font-size: 12px; text-transform: uppercase;">🥗 Dinner (08:30 PM)</span>
                      <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 4px;">${currentDayPlan.dinner.name}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Portion: ${currentDayPlan.dinner.portionSize} | Calories: ${currentDayPlan.dinner.calories} kcal</div>
                    </div>
                  </div>
                ` : `
                  <div style="padding: 15px; border: 1px dashed #cbd5e1; border-radius: 12px; text-align: center; color: #64748b; font-size: 13px;">
                    Review and follow today's clinical nutrition recipes safely.
                  </div>
                `}

                <div style="margin-top: 25px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                  This is an automated clinical notification from Aahar AI Workspace, dispatched securely via integrated Google APIs.
                </div>
              </div>
            `;
          } else if (type === 'water') {
            emailSubject = "Aahar AI: Hydration Reminder Synced to Google Tasks";
            const targetLiters = userProfile.dietPlan?.days?.[0]?.waterTargetLiters || 3.0;
            emailBodyHtml = `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0284c7; padding-bottom: 15px;">
                  <h1 style="color: #0284c7; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Aahar AI Companion</h1>
                  <p style="color: #4b5563; font-size: 14px; margin: 5px 0 0 0; font-family: monospace;">CLINICAL HYDRATION HUB</p>
                </div>
                
                <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                  <h3 style="color: #0369a1; margin: 0 0 6px 0; font-size: 16px; font-weight: bold;">✓ Hydration Target Dispatched</h3>
                  <p style="color: #075985; font-size: 13px; margin: 0; line-height: 1.5;">
                    Your goal to consume <strong>${targetLiters} Liters</strong> of water has been synced to Google Tasks.
                  </p>
                </div>

                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 15px 0;">
                  Adequate water intake prevents chronic fatigue, stabilizes electrolyte balance, keeps visceral organs running efficiently, and balances metabolic heat. Make sure to space your cups evenly throughout the day!
                </p>

                <div style="margin-top: 25px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                  This is an automated clinical notification from Aahar AI Workspace, dispatched securely via integrated Google APIs.
                </div>
              </div>
            `;
          } else if (type === 'weight') {
            emailSubject = "Aahar AI: Weight Tracking Reminder Synced to Google Tasks";
            emailBodyHtml = `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #d97706; padding-bottom: 15px;">
                  <h1 style="color: #d97706; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Aahar AI Companion</h1>
                  <p style="color: #4b5563; font-size: 14px; margin: 5px 0 0 0; font-family: monospace;">WEIGHT & METABOLIC METRICS</p>
                </div>
                
                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                  <h3 style="color: #b45309; margin: 0 0 6px 0; font-size: 16px; font-weight: bold;">✓ Fasting Weight Tracker Active</h3>
                  <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                    Your reminder for daily morning weight check-ins has been pushed to Google Tasks successfully.
                  </p>
                </div>

                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 15px 0;">
                  Remember to take measurements in the morning after waking up, prior to eating or drinking. This produces consistent values, filtering out digestive offsets to give our system high-accuracy analytics on your fat loss and muscle retention velocity.
                </p>

                <div style="margin-top: 25px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                  This is an automated clinical notification from Aahar AI Workspace, dispatched securely via integrated Google APIs.
                </div>
              </div>
            `;
          }

          if (emailSubject && emailBodyHtml) {
            await sendGmailMessage(token, userEmail, emailSubject, emailBodyHtml);
          }
        }
      }

      setSyncStatus(
        sendEmailCopy 
          ? `Successfully synchronized ${tasksToCreate.length} task(s) and dispatched Gmail verification!`
          : `Successfully dispatched ${tasksToCreate.length} task(s) to Google Tasks!`
      );
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to synchronize task lists. Check workspace API status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-glass-border space-y-4 relative overflow-hidden">
      <div className="absolute right-3 top-3 opacity-15">
        <ListTodo className="w-16 h-16 text-mecha-neon" />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-mecha-green/10 border border-mecha-neon/20 flex items-center justify-center text-mecha-neon">
          <ListTodo className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Google Tasks Integration</h4>
          <p className="text-[11px] text-tea-mist leading-tight">Sync your clinical meal timings and health milestones as tasks.</p>
        </div>
      </div>

      {!isLinked ? (
        <div className="bg-black/20 rounded-2xl p-4 border border-glass-border/30 text-center space-y-3">
          <p className="text-xs text-tea-mist leading-relaxed">
            Link your Google Account to authorize Google Tasks permissions and sync your wellness targets seamlessly.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-neutral-800" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span>Connect Google Tasks</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={async () => {
                const token = await getAccessToken();
                if (token) await handleFetchLists(token);
              }}
              disabled={loading}
              className="px-3 py-2 bg-black/40 border border-glass-border hover:border-mecha-neon/30 rounded-xl text-xs font-mono text-tea-mist flex items-center gap-1.5 justify-center cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-mecha-neon ${loading ? "animate-spin" : ""}`} />
              <span>Fetch Lists</span>
            </button>

            {taskLists.length > 0 && (
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="flex-1 bg-black/40 border border-glass-border text-bamboo-beige text-xs rounded-xl px-3 py-2 outline-none focus:border-mecha-neon/50 cursor-pointer"
              >
                {taskLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    📋 {list.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-black/10 rounded-xl border border-glass-border/30">
            <label className="flex items-center gap-2 cursor-pointer select-none w-full">
              <input
                type="checkbox"
                checked={sendEmailCopy}
                onChange={(e) => setSendEmailCopy(e.target.checked)}
                className="rounded border-glass-border bg-black/40 text-mecha-neon focus:ring-mecha-neon/50 w-4 h-4 cursor-pointer accent-mecha-neon"
              />
              <span className="text-[11px] text-tea-mist flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-mecha-neon" /> Send task confirmation copy to email
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleSyncToTasks('meals')}
              disabled={loading || !selectedListId}
              className="py-2 px-3 rounded-xl bg-mecha-green/10 border border-mecha-neon/20 hover:border-mecha-neon/50 text-mecha-neon hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sync Diet Plan</span>
            </button>

            <button
              onClick={() => handleSyncToTasks('water')}
              disabled={loading || !selectedListId}
              className="py-2 px-3 rounded-xl bg-sky-950/40 border border-sky-400/20 hover:border-sky-400/50 text-sky-400 hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Water Reminder</span>
            </button>

            <button
              onClick={() => handleSyncToTasks('weight')}
              disabled={loading || !selectedListId}
              className="py-2 px-3 rounded-xl bg-amber-950/40 border border-amber-400/20 hover:border-amber-400/50 text-amber-400 hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Weight Check</span>
            </button>
          </div>

          {syncStatus && (
            <div className="p-3 bg-mecha-green/10 border border-mecha-neon/30 text-mecha-neon text-xs font-mono rounded-xl flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
