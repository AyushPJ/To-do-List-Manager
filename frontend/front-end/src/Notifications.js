import React, { Component } from 'react';
import './App.css';
import getCookie from './tools';


class Notifications extends Component {
    constructor(props) {
        super(props);
        this.swRegistration = null;
        this.applicationServerPublicKey = null;
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    registerServiceWorker() {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                this.swRegistration = registration;
                this.askPermission();
            })
            .catch((err) => {
                console.error("Unable to register SW", err);
            });
    }

    askPermission() {
        return new Promise((resolve, reject) => {
            const permissionResult = Notification.requestPermission((result) => {
                resolve(result);
            });
            if (permissionResult) {
                permissionResult.then(resolve, reject);
            }
        })
            .then((permissionResult) => {
                if (permissionResult !== 'granted')
                    throw new Error("Permission denied.");
                else
                    this.getApplicationServerPublicKey();

            });
    }

    getApplicationServerPublicKey(){
        fetch('/pushNotifications/getApplicationServerPublicKey', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((resp)=>{
            if(resp.status === 401)
                this.props.setPropState('authorized',false);
            else if(resp.status !== 200)
                throw new Error('Bad status code from server.');

            return resp.json();
            
        })
        .then((responseData)=>{
            if (responseData && responseData['Application-Server-Public-Key']) {
                this.applicationServerPublicKey = responseData['Application-Server-Public-Key'];
                this.subscribeUserToPush();
            }
        });
    }

    subscribeUserToPush() {

        const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(
                this.applicationServerPublicKey
            )
        };

        this.swRegistration.pushManager.subscribe(subscribeOptions)
            .then((pushSubsciption) => {
                this.sendSubscriptionToBackEnd(pushSubsciption);
                return pushSubsciption;
            });
    }

    unsubscribeUser() {
        this.swRegistration.pushManager.getSubscription()
            .then(function (subscription) {
                if (subscription) {
                    return subscription.unsubscribe();
                }
            })
            .catch(function (error) {
                console.log('Error unsubscribing', error);
            })
            .then(function () {

                console.log('User is unsubscribed.');

            });
    }

    sendSubscriptionToBackEnd(subscription) {
        fetch('/pushNotifications/save-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCookie('csrf_access_token'),
            },
            body: JSON.stringify(subscription),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Bad status code from server.');
                }

                return response.json();

            })
            .then((responseData) => {
                if (!(responseData.data && responseData.data.success)) {
                    throw new Error('Bad response from server');
                }
            });
    }

    testPushMsg() {
        return fetch('/pushNotifications/trigger-push-msg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCookie('csrf_access_token'),
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Bad status code from server.');
                }

                return response.json();

            })
            .then((responseData) => {
                if (!(responseData.data && responseData.data.success)) {
                    throw new Error('Bad response from server');
                }
            });
    }

    

    render() {
        return (
            <React.Fragment>
                <button className="btn btn-primary" onClick={() => this.registerServiceWorker()}>Enable Notifications</button>
                <button className="btn btn-secondary" onClick={() => this.testPushMsg()}>Test Notifications</button>
            </React.Fragment>

        )
    }
}

export default Notifications;