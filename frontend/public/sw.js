self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); } catch { data = { title: 'Unddr', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Unddr', {
      body: data.body || 'You have a new message',
      icon: data.icon || '/assets/pngs/logo-unddr-icon-128.png',
      badge: '/assets/pngs/logo-unddr-icon-128.png',
      data: data.data || { url: '/' },
      vibrate: [200, 100, 200],
      tag: 'unddr-message',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow(targetUrl);
      })
  );
});
