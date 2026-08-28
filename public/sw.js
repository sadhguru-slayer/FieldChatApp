// Service Worker for handling native notifications on mobile and desktop
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
