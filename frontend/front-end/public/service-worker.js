self.addEventListener('push', (event) => {
    if (event.data) {
        const title = 'tu-du';
        const options = {
            body: 'This notification has data attached to it that is printed ' +
                'to the console when it\'s clicked.',
            tag: 'data-notification',
            data: {
                time: new Date(Date.now()).toString(),
                message: 'Hello, World!'
            }
        };



        event.waitUntil(self.registration.showNotification(title, options));

    }
    else {
        console.log("This push event has no data.")
    }
});

self.addEventListener('notificationclick', (event) => {
    const urlToOpen = new URL(self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;

        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            console.log(windowClient);
            if (windowClient.url === urlToOpen) {
                matchingClient = windowClient;
                break;
            }
        }

        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);

});
