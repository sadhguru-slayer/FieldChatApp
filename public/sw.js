// Service Worker for handling native notifications and WebPush/VAPID on mobile and desktop
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming WebPush / VAPID Push Events
self.addEventListener('push', (event) => {
  let data = { title: 'New Notification', body: '' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'Fieldchat Notification';
  const options = {
    body: data.body || data.message || '',
    icon: data.avatar || data.icon || '/Logo.png',
    badge: '/Logo.png',
    tag: data.id || data.tag || 'general-notification',
    data: data.data || data,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetConvId = event.notification.data?.conversation_id;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find a window client that is already open
      if (clientList.length > 0) {
        let client = clientList[0];
        // Prefer currently focused one
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        
        // Post message to the app to navigate to the specific chat if needed
        if (targetConvId) {
          client.postMessage({
            type: 'NAVIGATE_TO_CONVERSATION',
            conversationId: targetConvId,
          });
        }
        
        return client.focus();
      }
      
      // Fallback: open a new window
      if (self.clients.openWindow) {
        const url = targetConvId ? `/?conv=${targetConvId}` : '/';
        return self.clients.openWindow(url);
      }
    })
  );
});
