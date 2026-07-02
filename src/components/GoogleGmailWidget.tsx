import React, { useState, useEffect } from "react";
import { Mail, Send, RefreshCw, Check, AlertCircle, FileText, Sparkles } from "lucide-react";
import { getAccessToken, auth, googleSignIn } from "../lib/firebase";
import { sendGmailMessage } from "../lib/workspace";
import { UserProfile } from "../types";

interface GoogleGmailWidgetProps {
  userProfile: UserProfile;
}

export default function GoogleGmailWidget({ userProfile }: GoogleGmailWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [activeTab, setActiveTab] = useState<"diet" | "custom">("diet");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [customBody, setCustomBody] = useState("");

  // Populate default fields when component loads or userProfile changes
  useEffect(() => {
    const userEmail = auth.currentUser?.email || userProfile.email || "";
    setRecipient(userEmail);
    setSubject("Aahar AI: My Clinical Nutrition & Diet Plan");
  }, [userProfile]);

  // Check initial Auth
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAccessToken();
      if (token && auth.currentUser) {
        setIsLinked(true);
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
        const userEmail = result.user.email || userProfile.email || "";
        setRecipient(userEmail);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to connect Google Account. Ensure popup blocker is disabled.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getAccessToken();
    if (!token) {
      setErrorMsg("Please link your Google account first.");
      return;
    }

    if (!recipient.trim()) {
      setErrorMsg("Recipient email address is required.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSyncStatus(null);

    try {
      let finalBodyHtml = "";

      if (activeTab === "diet") {
        // Construct a beautifully formatted HTML email with the current diet plan
        const plan = userProfile.dietPlan;
        const firstDay = plan?.days?.[0];
        const calorieGoal = userProfile.onboardingData?.calorieTarget || 2000;
        
        finalBodyHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #047857; margin: 0; font-size: 24px;">Aahar AI Nutrition</h1>
              <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Your Clinical Indian Wellness companion</p>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
              <h3 style="color: #14532d; margin: 0 0 8px 0; font-size: 15px;">Today's Calorie Goal: ${calorieGoal} kcal</h3>
              <p style="color: #166534; font-size: 12px; margin: 0; line-height: 1.4;">
                This diet plan is custom calculated considering your clinical conditions: 
                <strong>${userProfile.onboardingData?.medicalConditions?.length ? userProfile.onboardingData.medicalConditions.join(", ") : "None"}</strong>.
              </p>
            </div>

            <h3 style="color: #334155; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;">Daily Meal Schedule</h3>
            
            ${firstDay ? `
              <div style="margin-bottom: 15px;">
                <div style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                  <strong style="color: #047857;">☀️ Breakfast (08:30 AM)</strong>
                  <div style="font-size: 14px; margin-top: 4px; font-weight: bold;">${firstDay.breakfast.name}</div>
                  <div style="font-size: 12px; color: #64748b;">Portion: ${firstDay.breakfast.portionSize} | Calories: ${firstDay.breakfast.calories} kcal</div>
                </div>
                
                <div style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                  <strong style="color: #047857;">🍱 Lunch (01:15 PM)</strong>
                  <div style="font-size: 14px; margin-top: 4px; font-weight: bold;">${firstDay.lunch.name}</div>
                  <div style="font-size: 12px; color: #64748b;">Portion: ${firstDay.lunch.portionSize} | Calories: ${firstDay.lunch.calories} kcal</div>
                </div>
                
                <div style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                  <strong style="color: #047857;">☕ Evening Snack (05:30 PM)</strong>
                  <div style="font-size: 14px; margin-top: 4px; font-weight: bold;">${firstDay.snacks.name}</div>
                  <div style="font-size: 12px; color: #64748b;">Portion: ${firstDay.snacks.portionSize} | Calories: ${firstDay.snacks.calories} kcal</div>
                </div>
                
                <div style="padding: 10px; border-bottom: 1px solid #f1f5f9;">
                  <strong style="color: #047857;">🥗 Dinner (08:30 PM)</strong>
                  <div style="font-size: 14px; margin-top: 4px; font-weight: bold;">${firstDay.dinner.name}</div>
                  <div style="font-size: 12px; color: #64748b;">Portion: ${firstDay.dinner.portionSize} | Calories: ${firstDay.dinner.calories} kcal</div>
                </div>
              </div>
            ` : `
              <p style="color: #64748b; font-size: 13px;">No direct meal plan formulated yet. Set your targets in the Onboarding screen.</p>
            `}

            <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              Email generated securely via Gmail Integration. Keep making healthy choices!
            </div>
          </div>
        `;
      } else {
        // Construct clean HTML with the custom formatted message
        const formattedCustom = customBody.replace(/\n/g, "<br />");
        finalBodyHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #047857; margin: 0; font-size: 24px;">Aahar AI Nutrition Message</h1>
              <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Shared Wellness & Meal Update</p>
            </div>
            
            <div style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 25px;">
              ${formattedCustom}
            </div>

            <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              Sent securely via Aahar AI Google Workspace integrated dashboard.
            </div>
          </div>
        `;
      }

      await sendGmailMessage(token, recipient, subject, finalBodyHtml);
      setSyncStatus(`Successfully dispatched email to: ${recipient}`);
      if (activeTab === "custom") {
        setCustomBody("");
      }
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to dispatch Gmail. Verify permissions or workspace connectivity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-glass-border space-y-4 relative overflow-hidden">
      <div className="absolute right-3 top-3 opacity-15">
        <Mail className="w-16 h-16 text-mecha-neon" />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-mecha-green/10 border border-mecha-neon/20 flex items-center justify-center text-mecha-neon">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Gmail Communication Hub</h4>
          <p className="text-[11px] text-tea-mist leading-tight">Send healthy diets, nutrition guidelines, and message updates instantly via Gmail.</p>
        </div>
      </div>

      {!isLinked ? (
        <div className="bg-black/20 rounded-2xl p-4 border border-glass-border/30 text-center space-y-3">
          <p className="text-xs text-tea-mist leading-relaxed">
            Link your Google Account to authorize Gmail send permissions and dispatch your wellness logs directly to any inbox.
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
            <span>Connect Gmail Sender</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-glass-border/30">
            <button
              onClick={() => {
                setActiveTab("diet");
                setSubject("Aahar AI: My Clinical Nutrition & Diet Plan");
              }}
              className={`flex-1 py-1.5 text-center text-xs font-mono border-b-2 transition-all ${
                activeTab === "diet" 
                  ? "border-mecha-neon text-mecha-neon font-bold" 
                  : "border-transparent text-tea-mist hover:text-white"
              }`}
            >
              🥗 Share Diet Plan
            </button>
            <button
              onClick={() => {
                setActiveTab("custom");
                setSubject("Aahar AI: Healthy Message Check-in");
              }}
              className={`flex-1 py-1.5 text-center text-xs font-mono border-b-2 transition-all ${
                activeTab === "custom" 
                  ? "border-mecha-neon text-mecha-neon font-bold" 
                  : "border-transparent text-tea-mist hover:text-white"
              }`}
            >
              ✍️ Custom Message
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-tea-mist mb-1">To (Recipient Email)</label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="w-full bg-black/40 border border-glass-border text-bamboo-beige text-xs rounded-xl px-3 py-2 outline-none focus:border-mecha-neon/50 font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-tea-mist mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email Subject"
                required
                className="w-full bg-black/40 border border-glass-border text-bamboo-beige text-xs rounded-xl px-3 py-2 outline-none focus:border-mecha-neon/50 font-sans"
              />
            </div>

            {activeTab === "diet" ? (
              <div className="p-3 rounded-2xl bg-mecha-green/5 border border-mecha-neon/10 space-y-1">
                <span className="text-[10px] text-mecha-neon font-mono flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Auto-Generated Content
                </span>
                <p className="text-[11px] text-tea-mist leading-tight">
                  This will format your current calorie targets ({userProfile.onboardingData?.calorieTarget || 2000} kcal) and full active daily meal program into a clean, aesthetic email.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-mono text-tea-mist mb-1">Message Body</label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Type your message, recipe queries, or diet recommendations..."
                  required={activeTab === "custom"}
                  rows={3}
                  className="w-full bg-black/40 border border-glass-border text-bamboo-beige text-xs rounded-xl px-3 py-2 outline-none focus:border-mecha-neon/50 font-sans resize-none scrollbar-thin"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon text-black text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{loading ? "Sending..." : "Dispatch via Gmail"}</span>
            </button>
          </form>

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
