export type CRMApiResult = { ok: boolean; error?: string };

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({ ok: false, error: "Invalid server response" }));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export const crmApi = {
  login: (email: string, password: string) => request("/api/auth.php?action=login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/api/auth.php?action=me"),
  logout: () => request("/api/auth.php?action=logout", { method: "POST", body: "{}" }),
  forgotPassword: (email: string) => request("/api/auth.php?action=forgot", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email: string, code: string, password: string) => request("/api/auth.php?action=reset", { method: "POST", body: JSON.stringify({ email, code, password }) }),
  changeCredentials: (currentPassword: string, email: string, password: string) => request("/api/auth.php?action=change-credentials", { method: "POST", body: JSON.stringify({ currentPassword, email, password }) }),
  list: () => request("/api/crm.php?action=list"),
  saveCRM: (items: unknown[]) => request("/api/crm.php?action=save-crm", { method: "POST", body: JSON.stringify({ items }) }),
  saveEquipment: (items: unknown[]) => request("/api/crm.php?action=save-equipment", { method: "POST", body: JSON.stringify({ items }) }),
  saveDeployments: (items: unknown[]) => request("/api/crm.php?action=save-deployments", { method: "POST", body: JSON.stringify({ items }) }),
  saveRecycle: (items: unknown[]) => request("/api/crm.php?action=save-recycle", { method: "POST", body: JSON.stringify({ items }) }),
  saveProfile: (profile: unknown) => request("/api/crm.php?action=save-profile", { method: "POST", body: JSON.stringify({ profile }) }),
  saveSiteCopy: (copy: unknown) => request("/api/crm.php?action=save-site-copy", { method: "POST", body: JSON.stringify({ copy }) }),
};