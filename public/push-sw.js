// Shows Menton push notifications and opens the matching phone screen when one is tapped.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  event.waitUntil(
    self.registration.showNotification(notification.title || "Menton", {
      body: notification.body || "",
      icon: notification.icon || "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: notification.tag || data.notificationId,
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const params = new URLSearchParams();
  if (data.category) params.set("category", data.category);
  const target = `/m/go?${params.toString()}`;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find((client) => "focus" in client);
        // A page this worker does not control cannot be navigated; open a new one instead.
        if (open) {
          return open
            .navigate(target)
            .then((client) => client && client.focus())
            .catch(() => self.clients.openWindow(target));
        }
        return self.clients.openWindow(target);
      }),
  );
});
