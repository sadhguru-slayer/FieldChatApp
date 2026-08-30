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

  const notifData = data.data || data;
  const conversationId = notifData.conversation_id || data.conversation_id;
  const tag = conversationId ? `chat-${conversationId}` : (data.id || data.tag || 'general-notification');

  event.waitUntil(
    (async () => {
      let unreadCount = 1;
      let messages = [];
      try {
        const existingNotifs = await self.registration.getNotifications({ tag });
        if (existingNotifs && existingNotifs.length > 0) {
          const existing = existingNotifs[0];
          const prevCount = existing.data?.unreadCount || 1;
          unreadCount = prevCount + 1;
          messages = existing.data?.messages || [];
        }
      } catch (e) {
        console.warn('Error reading existing notifications:', e);
      }

      const senderName = notifData.username || data.title?.replace('New message from ', '') || 'Someone';
      const messageBody = data.body || data.message || '';
      if (messageBody) {
        messages.push(`${senderName}: ${messageBody}`);
      }

      if (messages.length > 5) {
        messages.shift();
      }

      let baseTitle = data.title || 'Fieldchat Notification';
      baseTitle = baseTitle.replace(/\s*\(\d+\s*new messages?\)/i, '');
      const cleanedTitle = baseTitle.replace('New message from ', '');
      const displayTitle = unreadCount > 1 
        ? `${cleanedTitle} (${unreadCount} messages)` 
        : baseTitle;

      const displayBody = messages.length > 1
        ? messages.join('\n')
        : messageBody;

      const options = {
        body: displayBody,
        icon: notifData.avatar || data.avatar || data.icon || '/Logo.png',
        badge: '/Logo.png',
        tag: tag,
        renotify: true,
        data: {
          ...notifData,
          unreadCount: unreadCount,
          messages: messages,
          conversation_id: conversationId,
        },
        vibrate: [100, 50, 100],
      };

      return self.registration.showNotification(displayTitle, options);
    })()
  );
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
