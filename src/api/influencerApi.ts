import axios from "axios";
import { apiClient, normalizeApiError } from "./client";

export interface InfluencerFormData {
  fullname: string;
  contact: string;
  sociallink: string;
  followers: number | string;
  niche: string;
  message: string;
}

export const influencerApi = {
  submitCollaboration: async (data: InfluencerFormData) => {
    // Hidden inputs required by spec
    const payload = {
      ...data,
      followers: Number(data.followers) || data.followers,
      _subject: "New Influencer Collaboration Request",
      _captcha: "false",
    };

    try {
      // First attempt submission to Formspree
      const res = await axios.post("https://formspree.io/f/maqvajdo", payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });
      return { success: true, data: res.data };
    } catch (formspreeErr: any) {
      console.warn("Formspree submission error, attempting backend fallback:", formspreeErr);
      try {
        // Fallback to backend custom endpoint POST /api/leads/influencer
        const fallbackRes = await apiClient.post("/leads/influencer", payload);
        return { success: true, data: fallbackRes.data };
      } catch (backendErr: any) {
        throw new Error(normalizeApiError(backendErr) || normalizeApiError(formspreeErr));
      }
    }
  },
};

