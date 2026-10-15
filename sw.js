const SHELL = "spectra-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.add(new URL("offline.html", self.registration.scope))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Spectra Sense", body: "A notice is ready.", href: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* A notice without JSON still shows the fallback line. */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { href: payload.href || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = String((event.notification.data && event.notification.data.href) || "/");
  const url = new URL(href.replace(/^\//, ""), self.registration.scope);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(url.href);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url.href);
      return undefined;
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const offline = await caches.match(new URL("offline.html", self.registration.scope));
      return offline || new Response("Spectra is offline on this machine.", { status: 200 });
    }),
  );
});
