self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", () => {
  // La HU-2001 no implementa caché offline para evitar contenido desactualizado.
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Sistema Obras";
  const options = {
    body: payload.body || "Tienes una actualización pendiente.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag,
    data: {
      url: payload.data?.url || "/dashboard",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destino = new URL(
    event.notification.data?.url || "/dashboard",
    self.location.origin,
  );
  const urlDestino =
    destino.origin === self.location.origin
      ? destino.href
      : new URL("/dashboard", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientes) => {
        const cliente = clientes[0];

        if (cliente) {
          await cliente.navigate(urlDestino);
          return cliente.focus();
        }

        return self.clients.openWindow(urlDestino);
      }),
  );
});
