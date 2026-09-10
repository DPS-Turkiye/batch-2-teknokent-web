import axios from "axios";

import type { DashboardNotification } from "@/types/landing";
import { getPublicBackendUrl } from "@/lib/const";
import { currentIdToken } from "@/lib/firebase/auth";

async function authorization() {
  const token = await currentIdToken();
  if (!token) {
    throw new Error("Bildirimler için oturum açmanız gerekiyor.");
  }
  return { Authorization: `Bearer ${token}` };
}

export async function getNotifications() {
  const response = await axios.get<DashboardNotification[]>(
    `${getPublicBackendUrl()}/api/notifications`,
    { headers: await authorization() },
  );
  return response.data;
}

export async function markNotificationRead(id: string) {
  const response = await axios.patch<DashboardNotification>(
    `${getPublicBackendUrl()}/api/notifications/${encodeURIComponent(id)}/read`,
    undefined,
    { headers: await authorization() },
  );
  return response.data;
}

export async function deleteNotification(id: string) {
  await axios.delete(
    `${getPublicBackendUrl()}/api/notifications/${encodeURIComponent(id)}`,
    { headers: await authorization() },
  );
}
