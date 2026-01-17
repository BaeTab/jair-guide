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
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
