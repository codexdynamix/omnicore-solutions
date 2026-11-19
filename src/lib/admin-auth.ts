/**
 * Stores the local-only backoffice profile for this browser.
 */

export interface AdminProfile {
  email: string;
  fullName: string;
  role: string;
  phone: string;
  yardLocation: string;
}
const PROFILE_STORAGE_KEY = "omnicore_admin_profile";

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  email: "",
  fullName: "",
  role: "",
  phone: "",
  yardLocation: "",
};

export function getStoredAdminProfile(): AdminProfile {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_PROFILE;
    const parsed = JSON.parse(raw);
    const isLegacyDemoProfile =
      parsed.email === "admin@omnicore.co.zw" ||
      parsed.fullName === "Harare Operations Administrator";
    return isLegacyDemoProfile ? DEFAULT_ADMIN_PROFILE : { ...DEFAULT_ADMIN_PROFILE, ...parsed };
  } catch {
    return DEFAULT_ADMIN_PROFILE;
  }
}

export function saveStoredAdminProfile(profile: Partial<AdminProfile>): AdminProfile {
  const current = getStoredAdminProfile();
  const updated: AdminProfile = { ...current, ...profile };
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}
