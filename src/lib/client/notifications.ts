import axios from "axios";

import type { NotificationPreferences } from "@/interfaces/notification";
import type { DashboardNotification } from "@/types/landing";
import { getPublicBackendUrl } from "@/lib/const";
import { currentIdToken } from "@/lib/firebase/auth";
import { clientText } from "@/i18n/client-texts";

async function authorization() {
  const token = await currentIdToken();
  if (!token) {
    throw new Error(clientText("notificationsSignIn"));
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

export async function markAllNotificationsRead() {
  await axios.patch(
    `${getPublicBackendUrl()}/api/notifications/read-all`,
    undefined,
    { headers: await authorization() },
  );
}

export async function getNotificationPreferences() {
  const response = await axios.get<NotificationPreferences>(
    `${getPublicBackendUrl()}/api/notifications/preferences`,
    { headers: await authorization() },
  );
  return response.data;
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences,
) {
  const response = await axios.put<NotificationPreferences>(
    `${getPublicBackendUrl()}/api/notifications/preferences`,
    preferences,
    { headers: await authorization() },
  );
  return response.data;
}

export async function registerPushToken(token: string) {
  await axios.post(
    `${getPublicBackendUrl()}/api/notifications/push-tokens`,
    { token },
    { headers: await authorization() },
  );
}

export async function unregisterPushToken(token: string) {
  await axios.delete(`${getPublicBackendUrl()}/api/notifications/push-tokens`, {
    data: { token },
    headers: await authorization(),
  });
}
