importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDgciD4Z10cWAhZdTsT0KelBJiWI9MXbpo",
    authDomain: "jair-guide.firebaseapp.com",
    projectId: "jair-guide",
    storageBucket: "jair-guide.firebasestorage.app",
    messagingSenderId: "501826435444",
    appId: "1:501826435444:web:4503451fa673e282569421"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // FCM 메시지에 notification 페이로드가 있으면 FCM이 자동으로 알림을 표시합니다.
    // 따라서 data-only 메시지일 때만 수동으로 알림을 표시해야 중복 알림을 방지할 수 있습니다.
    if (payload.notification) {
        // notification 페이로드가 있는 경우, FCM이 자동으로 알림을 표시하므로
        // 여기서 추가로 showNotification을 호출하면 안 됩니다.
        console.log('[firebase-messaging-sw.js] Notification payload detected, FCM will handle display automatically.');
        return;
    }

    // data-only 메시지인 경우에만 수동으로 알림 표시
    if (payload.data) {
        const notificationTitle = payload.data.title || '새 알림';
        const notificationOptions = {
            body: payload.data.body || '',
            icon: '/pwa-192x192.png',
            data: payload.data
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});
