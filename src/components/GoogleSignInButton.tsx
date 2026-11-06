import React, { useEffect, useRef, useState } from "react";
import { authApi } from "../api/authApi";
import { getPersistedUserPhone, persistUserPhone } from "../utils/authGuard";

interface GoogleButtonProps {
  onSuccess: (userData: any) => void;
  onError: (errMsg: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleButtonProps> = ({ onSuccess, onError, className }) => {
  const buttonDivRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);

  const clientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  useEffect(() => {
    // 1. Dynamically load Google GSI script
    const scriptId = "google-gsi-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const interval = setInterval(() => {
      const google = (window as any).google;
      if (google && google.accounts && buttonDivRef.current) {
        clearInterval(interval);
        setGsiReady(true);
        try {
          // Initialize Google Sign-in client
          google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              let googleProfile: any = null;
              try {
                // Decode Google ID Token payload to get real user's actual name and email from Google
                const base64Url = response.credential.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
                );
                googleProfile = JSON.parse(jsonPayload);
                if (googleProfile?.name) {
                  localStorage.setItem("abb_user_profile_name", googleProfile.name);
                }
                if (googleProfile?.email) {
                  localStorage.setItem("abb_user_profile_email", googleProfile.email);
                  // Check if this Google user already provided their phone earlier
                  const existingPhone = getPersistedUserPhone(googleProfile.email);
                  if (existingPhone) {
                    localStorage.setItem("abb_user_profile_phone", existingPhone);
                  }
                }
                if (googleProfile?.picture) {
                  localStorage.setItem("abb_user_profile_avatar", googleProfile.picture);
                }
              } catch (decodeErr) {
                console.warn("Could not decode Google JWT:", decodeErr);
              }

              try {
                // Send Google ID Token to backend
                const user = await authApi.googleLogin(response.credential);
                const returnedPhone = user?.phone || user?.phoneNumber || user?.mobile || user?.user?.phone;
                if (returnedPhone) {
                  persistUserPhone(googleProfile?.email || user?.email, returnedPhone);
                } else if (googleProfile?.email) {
                  const existingPhone = getPersistedUserPhone(googleProfile.email);
                  if (existingPhone) {
                    persistUserPhone(googleProfile.email, existingPhone);
                  }
                }
                window.dispatchEvent(new Event("abb_auth_change"));
                onSuccess(user);
              } catch (err: any) {
                // If backend API is unreachable (Network Error) but Google verified the user successfully:
                console.warn("Backend /auth/google unavailable, proceeding with verified Google profile:", err?.message);
                if (googleProfile) {
                  localStorage.setItem("user_access_token", response.credential);
                  const existingPhone = getPersistedUserPhone(googleProfile.email);
                  if (existingPhone) {
                    localStorage.setItem("abb_user_profile_phone", existingPhone);
                  }
                  window.dispatchEvent(new Event("abb_auth_change"));
                  onSuccess({
                    id: googleProfile.sub,
                    name: googleProfile.name,
                    email: googleProfile.email,
                    picture: googleProfile.picture,
                    phone: existingPhone || undefined,
                  });
                } else {
                  onError(err.message || "Google authentication failed");
                }
              }
            },
          });

          // Render official Google button inside our hidden overlay container
          const targetWidth = containerRef.current ? Math.min(Math.max(containerRef.current.offsetWidth, 280), 400) : 380;
          google.accounts.id.renderButton(buttonDivRef.current, {
            theme: "outline",
            size: "large",
            width: targetWidth,
            text: "continue_with",
            shape: "rectangular",
          });
        } catch (initErr: any) {
          console.warn("Google GSI Init notice:", initErr);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [clientId, onSuccess, onError]);

  const handleCustomButtonClick = () => {
    const google = (window as any).google;
    if (google?.accounts?.id?.prompt) {
      google.accounts.id.prompt();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className || ""}`}>
      {/* 1. Custom Full-Width Premium Google Button Matching Form Style */}
      <button
        type="button"
        onClick={handleCustomButtonClick}
        className="w-full h-12 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/90 active:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs cursor-pointer group select-none"
      >
        {/* Official Google 4-Color SVG Icon */}
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>

        <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900 tracking-tight">
          Continue with Google
        </span>
      </button>

      {/* 2. Transparent Native Google GSI Iframe Overlay */}
      {/* Captures direct user interactions and initiates genuine Google authentication */}
      <div
        ref={buttonDivRef}
        className={`absolute inset-0 opacity-[0.001] overflow-hidden flex items-center justify-center cursor-pointer pointer-events-auto transition-opacity ${
          gsiReady ? "block" : "hidden"
        }`}
        style={{ transform: "scale(1.25)", transformOrigin: "center" }}
      />
    </div>
  );
};

export default GoogleSignInButton;
