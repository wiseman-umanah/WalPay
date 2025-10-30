import { api } from "./client";
import type { SellerProfile } from "./auth";

export async function getProfile() {
  const { data } = await api.get<{ profile: SellerProfile }>("/profile");
  return data.profile;
}

export async function updateProfile(payload: { businessName?: string; country?: string }) {
  const { data } = await api.patch<{ profile: SellerProfile }>("/profile", payload);
  return data.profile;
}

