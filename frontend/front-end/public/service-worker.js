self.addEventListener('push', (event) => {
    if (event.data) {
        let data = {};
        try {
            data = event.data.json();
        }
        catch (error) {
            console.error(error);
        }
        let title = 'tu-du';
        let options = {};
        if (data.category) {
            if (data.category === "test") {
                title = title + ": Test";
                options = {
                    body: data.msg,
                    tag: 'test-notification',
                    icon: '/logo512.png',
                    badge: '/logo512.png',
                };
            }
            else if (data.category === 'reminder') {
                title = title + ": Reminder";
                options = {
                    body: data.task.taskName + " due in " + data.task.reminder,
                    tag: 'reminder_' + data.task.id,
                    icon: '/logo512.png',
                    badge: '/logo512.png',
                };
            }
            else if(data.category === 'overdue'){
                title = title + ": Overdue";
                options = {
                    body: data.task.taskName + " due now",
                    tag: 'overdue_' + data.task.id,
                    icon: '/logo512.png',
                    badge: '/logo512.png',
                };
            }

        }
        
        
        event.waitUntil(setTimeout(()=>self.registration.showNotification(title, options), 3000));

    }
    else {
        console.log("This push event has no data.")
    }
});

self.addEventListener('notificationclick', (event) => {
    const urlToOpen = new URL(self.location.origin + '/dashboard').href;
    console.log(urlToOpen);
    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;

        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
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
