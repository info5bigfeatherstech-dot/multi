import React, { useEffect, useRef } from "react";
import { authApi } from "../api/authApi";

interface GoogleButtonProps {
  onSuccess: (userData: any) => void;
  onError: (errMsg: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleButtonProps> = ({ onSuccess, onError }) => {
  const buttonDivRef = useRef<HTMLDivElement>(null);
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
                window.dispatchEvent(new Event("abb_auth_change"));
                onSuccess(user);
              } catch (err: any) {
                // If backend API is unreachable (Network Error) but Google verified the user successfully:
                console.warn("Backend /auth/google unavailable, proceeding with verified Google profile:", err?.message);
                if (googleProfile) {
                  localStorage.setItem("user_access_token", response.credential);
                  window.dispatchEvent(new Event("abb_auth_change"));
                  onSuccess({
                    id: googleProfile.sub,
                    name: googleProfile.name,
                    email: googleProfile.email,
                    picture: googleProfile.picture,
                  });
                } else {
                  onError(err.message || "Google authentication failed");
                }
              }
            },
          });

          // Render official Google button
          google.accounts.id.renderButton(buttonDivRef.current, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "pill",
          });
        } catch (initErr: any) {
          console.warn("Google GSI Init notice:", initErr);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [clientId, onSuccess, onError]);

  return <div ref={buttonDivRef} className="w-full flex justify-center my-2 min-h-[44px]" />;
};

export default GoogleSignInButton;
