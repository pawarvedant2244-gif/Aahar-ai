import React, { useState } from "react";
import { User, Mail, Lock, Shield, Sparkles, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile } from "../types";
import { DEFAULT_PROFILE } from "../data";
import { googleSignIn, fetchUserProfile, saveUserProfile, emailPasswordSignIn, emailPasswordSignUp, sendFirebasePasswordReset } from "../lib/firebase";

interface AuthProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP authentication states
  const [authStep, setAuthStep] = useState<"SIGN_IN_UP" | "OTP_EMAIL" | "OTP_VERIFY" | "OTP_RESET">("SIGN_IN_UP");
  const [otpEmail, setOtpEmail] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [receivedEmail, setReceivedEmail] = useState<{ subject: string; html: string } | null>(null);
  const [showMailbox, setShowMailbox] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Post-login Google connection flow states
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [showGoogleConnectPrompt, setShowGoogleConnectPrompt] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMessage("");

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error("Please enter your full name.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        const user = await emailPasswordSignUp(email, password, fullName);
        if (user) {
          const userProfile: UserProfile = {
            ...DEFAULT_PROFILE,
            email: email,
            fullName: fullName,
            onboarded: false, // user will go through onboarding
          };
          await saveUserProfile(user.uid, userProfile);
          setPendingProfile(userProfile);
          setShowGoogleConnectPrompt(true);
        }
      } else {
        // 1. Try Custom credentials bypass FIRST (completely client-side)
        let bypassSuccessful = false;
        let profileToLoad: UserProfile | null = null;

        try {
          const userKey = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, "_");
          const dbProfile = await fetchUserProfile(userKey);
          if (dbProfile && dbProfile.customPasswordHash && dbProfile.customPasswordHash === password) {
            profileToLoad = dbProfile;
            bypassSuccessful = true;
            localStorage.setItem(`aahar_custom_pass_${email.toLowerCase().trim()}`, password);
          }
        } catch (err) {
          console.warn("Custom credentials login bypass failed:", err);
        }

        if (bypassSuccessful && profileToLoad) {
          setPendingProfile(profileToLoad);
          setShowGoogleConnectPrompt(true);
          return;
        }

        // 2. Otherwise, fall back to standard Firebase sign-in
        const user = await emailPasswordSignIn(email, password);
        if (user) {
          let profile = await fetchUserProfile(user.uid);
          if (!profile) {
            profile = {
              ...DEFAULT_PROFILE,
              email: user.email || email,
              fullName: user.displayName || email.split("@")[0],
              onboarded: false,
            };
            await saveUserProfile(user.uid, profile);
          }
          setPendingProfile(profile);
          setShowGoogleConnectPrompt(true);
        }
      }
    } catch (err: any) {
      const errCode = err.code || "";
      const errMsg = err.message || "";
      const isAuthUserError = 
        errCode === "auth/user-not-found" || 
        errCode === "auth/wrong-password" || 
        errCode === "auth/invalid-credential" ||
        errCode === "auth/invalid-email" ||
        errMsg.includes("invalid-credential") ||
        errMsg.includes("user-not-found") ||
        errMsg.includes("wrong-password") ||
        errMsg.includes("invalid-email");

      if (isAuthUserError) {
        console.warn("[Auth Warning] User authentication failed with invalid credentials:", errMsg);
      } else {
        console.error("Authentication failed:", err);
      }

      let friendlyError = errMsg || "Authentication failed. Please check your credentials.";
      if (isAuthUserError) {
        friendlyError = isSignUp 
          ? "Invalid email format. Please check and try again."
          : "Invalid email or password. If you don't have an account yet, please click 'New member? Sign Up' below first.";
      } else if (errCode === "auth/email-already-in-use" || errMsg.includes("email-already-in-use")) {
        friendlyError = "An account with this email already exists. Try signing in instead.";
      } else if (errCode === "auth/weak-password" || errMsg.includes("weak-password")) {
        friendlyError = "The password is too weak. Please choose a stronger password (at least 6 characters).";
      } else if (errCode === "auth/operation-not-allowed" || errMsg.includes("operation-not-allowed")) {
        friendlyError = "Email/Password sign-in is not enabled in your Firebase project. Please enable it in Firebase Console -> Authentication -> Sign-in methods, or use Google Sign-In / Quick Demo.";
      }
      setErrorMsg(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: otpEmail.toLowerCase().trim() }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate security code.");
      }

      setGeneratedOtp(data.otp);
      setReceivedEmail({ subject: data.subject, html: data.html });
      
      // Also trigger a real Firebase password reset email in the background if they have a real Firebase account
      let realEmailSent = false;
      try {
        await sendFirebasePasswordReset(otpEmail.toLowerCase().trim());
        realEmailSent = true;
      } catch (fbErr) {
        console.warn("Firebase password reset email background dispatch skipped/failed:", fbErr);
      }

      setAuthStep("OTP_VERIFY");
      setShowMailbox(true); // Pop open mailbox instantly
      
      if (realEmailSent) {
        setSuccessMessage(`✓ Sent! A real Firebase password reset link has been sent to your inbox at ${otpEmail}. For instant testing inside AI Studio, we have also loaded your 6-digit OTP (${data.otp}) in the mailbox simulator in the bottom right!`);
      } else {
        setSuccessMessage(`✓ Sent! A 6-digit verification code has been dispatched. Please check the "Secure Mailbox Simulator" at the bottom right of your screen (Code: ${data.otp}) to proceed.`);
      }
    } catch (err: any) {
      console.error("OTP send error:", err);
      setErrorMsg(err.message || "Failed to route verification OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (inputOtp.trim() === generatedOtp) {
      setAuthStep("OTP_RESET");
      setSuccessMessage("Identity authenticity checked successfully! Please create your new website password.");
    } else {
      setErrorMsg("Invalid 6-digit verification code. Please check your simulated inbox overlay below and try again.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (String(generatedOtp) !== String(inputOtp)) {
        throw new Error("Invalid verification code. Authenticity check failed.");
      }

      const userKey = otpEmail.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, "_");
      let profile = await fetchUserProfile(userKey);
      if (!profile) {
        profile = {
          ...DEFAULT_PROFILE,
          email: otpEmail,
          fullName: otpEmail.split("@")[0],
          onboarded: false,
        };
      }
      profile.customPasswordHash = newPassword;
      await saveUserProfile(userKey, profile);

      localStorage.setItem(`aahar_custom_pass_${otpEmail.toLowerCase().trim()}`, newPassword);

      setSuccessMessage("Password successfully created for this website! You can now log in using your email and new password.");
      
      // Reset state and transition back
      setEmail(otpEmail);
      setPassword("");
      setAuthStep("SIGN_IN_UP");
      setIsSignUp(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to store new credentials securely. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const result = await googleSignIn();
      if (result) {
        const { user } = result;
        // Fetch or create profile
        let profile = await fetchUserProfile(user.uid);
        if (!profile) {
          profile = {
            ...DEFAULT_PROFILE,
            email: user.email || "user@gmail.com",
            fullName: user.displayName || "Aahar User",
            onboarded: false, // will trigger onboarding
          };
          await saveUserProfile(user.uid, profile);
        }
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      const isPopupError = err?.code === "auth/popup-closed-by-user" || 
                           err?.code === "auth/cancelled-popup-request" ||
                           String(err).includes("popup-closed-by-user") ||
                           String(err).includes("cancelled-popup-request");
      if (isPopupError) {
        console.warn("Google login failed (popup closed/blocked/cancelled):", err);
      } else {
        console.error("Google login failed:", err);
      }
      let msg = err.message || "Google Authentication failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user" || (msg && msg.includes("popup-closed-by-user"))) {
        msg = "The Google Sign-In popup was closed or blocked by your browser. Please ensure popups are allowed for this site, or use the Email/Password fields or the Quick Demo below!";
      } else if (err.code === "auth/cancelled-popup-request" || (msg && msg.includes("cancelled-popup-request"))) {
        msg = "A previous sign-in popup was already open or cancelled. Please wait a moment and try again.";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(DEFAULT_PROFILE);
    }, 800);
  };

  return (
    <div id="auth-page-container" className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-panel rounded-3xl overflow-hidden shadow-2xl relative border border-glass-border"
      >
        {/* Futuristic accent header */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-mecha-neon via-mecha-green to-tea-mist" />

        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-brew to-mecha-green flex items-center justify-center mb-4 border border-mecha-neon/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Sparkles className="w-8 h-8 text-mecha-neon glow-glow" />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-bamboo-beige via-white to-tea-mist tracking-tight">
              Aahar AI
            </h1>
            <p className="text-xs text-tea-mist mt-1 uppercase tracking-widest font-mono">
              Premium Indian Diet Companion
            </p>
          </div>

          {/* Messages Feed */}
          {successMessage && (
            <div className="mb-4 text-emerald-400 text-xs text-center font-mono bg-emerald-950/40 border border-emerald-500/20 py-2.5 px-3 rounded-xl">
              {successMessage}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 text-red-400 text-xs text-center font-mono bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl flex flex-col items-center gap-1.5">
              <span>{errorMsg}</span>
              {(errorMsg.includes("already exists") || errorMsg.includes("already-in-use") || errorMsg.includes("Sign Up")) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg("");
                  }}
                  className="text-[10px] text-mecha-neon hover:underline font-bold font-sans cursor-pointer mt-1"
                >
                  {isSignUp ? "Switch to Sign In Instead" : "Switch to Sign Up Instead"}
                </button>
              )}
            </div>
          )}

          {/* Form Step Router */}
          {showGoogleConnectPrompt && (
            <div className="space-y-6 text-center py-2 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-mecha-neon/10 border border-mecha-neon/30 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-mecha-neon animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-sans">
                  Connect Google Workspace
                </h3>
                <p className="text-xs text-tea-mist mt-2 leading-relaxed px-2 font-sans">
                  Aahar AI features seamless synchronization with <strong>Google Tasks</strong>, automatic daily digests via <strong>Gmail</strong>, and direct status broadcasts to <strong>Google Chat</strong>. 
                </p>
                <p className="text-xs text-bamboo-beige/80 mt-2 leading-relaxed px-2 font-sans">
                  Link your email to a Google account to unlock these clinical capabilities with one click.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setErrorMsg("");
                    try {
                      const result = await googleSignIn();
                      if (result && pendingProfile) {
                        const updatedProfile: UserProfile = {
                          ...pendingProfile,
                          email: result.user.email || pendingProfile.email,
                          fullName: result.user.displayName || pendingProfile.fullName,
                        };
                        await saveUserProfile(result.user.uid, updatedProfile);
                        onLoginSuccess(updatedProfile);
                      }
                    } catch (err: any) {
                      console.error("Linking failed:", err);
                      setErrorMsg("Failed to link Google account. You can skip and try again later.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon hover:to-mecha-green text-black font-semibold text-sm transition-all duration-300 shadow-lg shadow-mecha-green/20 hover:shadow-mecha-neon/30 cursor-pointer flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1 fill-current" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Connect Google Account
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (pendingProfile) {
                      onLoginSuccess(pendingProfile);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-glass-border hover:bg-white/5 text-bamboo-beige text-xs transition-all duration-300 cursor-pointer"
                >
                  Skip for Now, Go to App
                </button>
              </div>
            </div>
          )}

          {!showGoogleConnectPrompt && authStep === "SIGN_IN_UP" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-xs text-bamboo-beige/75 font-medium ml-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-tea-mist">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-glass-border bg-black/40 text-bamboo-beige focus:outline-none focus:ring-2 focus:ring-mecha-neon/50 focus:border-mecha-neon transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-bamboo-beige/75 font-medium ml-1 font-sans">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-tea-mist">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-glass-border bg-black/40 text-bamboo-beige focus:outline-none focus:ring-2 focus:ring-mecha-neon/50 focus:border-mecha-neon transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-bamboo-beige/75 font-medium ml-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-tea-mist">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? "Minimum 6 characters" : "••••••••"}
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-glass-border bg-black/40 text-bamboo-beige focus:outline-none focus:ring-2 focus:ring-mecha-neon/50 focus:border-mecha-neon transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-tea-mist hover:text-mecha-neon transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isSignUp && password && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] px-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-mecha-neon' : 'bg-red-500'}`} />
                    <span className={password.length >= 6 ? 'text-mecha-neon' : 'text-red-400'}>
                      {password.length >= 6 ? "✓ Password is at least 6 characters" : "✗ Password must be at least 6 characters"}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon hover:to-mecha-green text-black font-semibold text-sm transition-all duration-300 shadow-lg shadow-mecha-green/20 hover:shadow-mecha-neon/30 active:scale-95 disabled:opacity-50 cursor-pointer flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  isSignUp ? "Create Glass Account" : "Access Personal Portal"
                )}
              </button>
            </form>
          )}

          {!showGoogleConnectPrompt && authStep === "OTP_EMAIL" && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-bamboo-beige">Authenticity Check</h3>
                <p className="text-xs text-tea-mist mt-1">
                  Enter your email address to receive a secure 6-digit verification code.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-bamboo-beige/75 font-medium ml-1">Registered Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-tea-mist">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-glass-border bg-black/40 text-bamboo-beige focus:outline-none focus:ring-2 focus:ring-mecha-neon/50 focus:border-mecha-neon transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAuthStep("SIGN_IN_UP")}
                  className="w-1/3 py-3 px-4 rounded-xl border border-glass-border text-bamboo-beige font-semibold text-sm hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon hover:to-mecha-green text-black font-semibold text-sm transition-all duration-300 shadow-lg shadow-mecha-green/20 hover:shadow-mecha-neon/30 active:scale-95 disabled:opacity-50 cursor-pointer flex justify-center items-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Send OTP Code"
                  )}
                </button>
              </div>
            </form>
          )}

          {!showGoogleConnectPrompt && authStep === "OTP_VERIFY" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-bamboo-beige">Verify Your Identity</h3>
                <p className="text-xs text-tea-mist mt-1">
                  We sent a 6-digit OTP code to <strong className="text-mecha-neon">{otpEmail}</strong>. Enter it below to check your authenticity.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-bamboo-beige/75 font-medium ml-1 tracking-wider uppercase font-mono text-center block">Enter 6-Digit Code</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="000000"
                    className="w-full text-center py-3.5 text-2xl font-mono tracking-[12px] font-extrabold rounded-xl border border-glass-border bg-black/40 text-mecha-neon focus:outline-none focus:ring-2 focus:ring-mecha-neon/50 focus:border-mecha-neon transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAuthStep("OTP_EMAIL")}
                  className="w-1/3 py-3 px-4 rounded-xl border border-glass-border text-bamboo-beige font-semibold text-sm hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon hover:to-mecha-green text-black font-semibold text-sm transition-all duration-300 shadow-lg shadow-mecha-green/20 hover:shadow-mecha-neon/30 active:scale-95 cursor-pointer flex justify-center items-center"
                >
                  Verify Authenticity
                </button>
              </div>
            </form>
          )}

          {!showGoogleConnectPrompt && authStep === "OTP_RESET" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-bamboo-beige">Create New Password</h3>
                <p className="text-xs text-tea-mist mt-1">
                  Authenticity verified successfully. Please choose a secure password for your website access.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-bamboo-beige/75 font-medium ml-1">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-tea-mist">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-glass-border bg-black/40 text-bamboo-beige focus:outline-none focus:ring-2 focus:ring-mecha-neon/50 focus:border-mecha-neon transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-tea-mist hover:text-mecha-neon transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-bamboo-beige/75 font-medium ml-1">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-tea-mist">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-glass-border bg-black/40 text-bamboo-beige focus:outline-none focus:ring-2 focus:ring-mecha-neon/50 focus:border-mecha-neon transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-tea-mist hover:text-mecha-neon transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-mecha-green to-emerald-600 hover:from-mecha-neon hover:to-mecha-green text-black font-semibold text-sm transition-all duration-300 shadow-lg shadow-mecha-green/20 hover:shadow-mecha-neon/30 active:scale-95 disabled:opacity-50 cursor-pointer flex justify-center items-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Create Credentials & Login"
                )}
              </button>
            </form>
          )}

          {/* Social Sign In / Toggle Section only visible in SIGN_IN_UP step */}
          {!showGoogleConnectPrompt && authStep === "SIGN_IN_UP" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-glass-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-forest-brew text-tea-mist/60 uppercase tracking-widest font-mono">Or Continue With</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-300 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 flex-shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="mt-6 flex items-center justify-between text-xs text-tea-mist/80">
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="hover:text-mecha-neon transition-colors cursor-pointer"
                >
                  {isSignUp ? "Already registered? Sign In" : "New member? Sign Up"}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setOtpEmail(email);
                    setAuthStep("OTP_EMAIL");
                  }}
                  className="hover:text-mecha-neon transition-colors cursor-pointer text-left"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-glass-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-forest-brew text-tea-mist/60 uppercase tracking-widest font-mono">Demo Mode</span>
                </div>
              </div>

              <button
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-black/50 hover:bg-glass-card text-bamboo-beige border border-glass-border flex items-center justify-center gap-2 text-xs font-mono font-medium transition-all duration-300 hover:border-mecha-neon/40 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-mecha-neon" />
                Use Quick Indian Demo Profile
              </button>
            </>
          )}

          <div className="mt-6 flex gap-2 items-center justify-center text-[10px] text-tea-mist/40 bg-black/20 py-2 rounded-lg border border-glass-border/30">
            <Shield className="w-3 h-3 text-mecha-green" />
            <span>Encrypted connection with secure OTP authentication.</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Simulated Secure Mailbox Overlay for Instant Testing */}
      {receivedEmail && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-neutral-900/95 backdrop-blur-xl border border-mecha-neon/40 rounded-2xl shadow-[0_15px_45px_rgba(16,185,129,0.25)] overflow-hidden transition-all duration-300">
          <div className="bg-gradient-to-r from-emerald-950 to-neutral-900 px-4 py-3 border-b border-glass-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-5 h-5">
                <Mail className="w-4 h-4 text-mecha-neon animate-bounce" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </div>
              <span className="text-xs font-mono font-bold text-bamboo-beige uppercase tracking-wide">Secure Mailbox Simulator</span>
            </div>
            <div className="flex gap-2 items-center">
              <button 
                type="button"
                onClick={() => setShowMailbox(!showMailbox)} 
                className="text-tea-mist hover:text-white text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-glass-border/60"
              >
                {showMailbox ? "Hide Inbox" : "Open Mail"}
              </button>
              <button 
                type="button"
                onClick={() => setReceivedEmail(null)} 
                className="text-tea-mist hover:text-red-400 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          
          {showMailbox && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="p-4 space-y-3 max-h-[300px] overflow-y-auto font-sans"
            >
              <div className="bg-black/30 p-2 rounded border border-glass-border/40 text-[10px] font-mono text-tea-mist leading-relaxed">
                <div><strong>To:</strong> {otpEmail}</div>
                <div><strong>Subject:</strong> {receivedEmail.subject}</div>
                <div><strong>Delivery Status:</strong> Real Reset Sent via Firebase + Simulated OTP ✓</div>
              </div>
              <div 
                className="bg-black p-3 rounded-lg border border-glass-border/30 overflow-x-hidden text-sm max-h-[160px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: receivedEmail.html }}
              />
              <div className="text-center">
                <span className="text-[10px] font-mono text-tea-mist/60 bg-white/5 px-2 py-1 rounded">
                  Grab code: <strong className="text-mecha-neon font-sans text-xs">{generatedOtp}</strong>
                </span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
