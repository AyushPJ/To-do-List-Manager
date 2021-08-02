# tu-du
*get it?*

A generic to-do list manager.


Specifications: Flask back-end, ReactJS front-end, postgreSQL database

Uses flask-apscheduler to schedule reminders, and delivers them via push notifications (implemented using the W3 Push API).

Authentication is done using JWT with the help of jwt-extended python module.

front-end was designed mostly using bootstrap and react-bootstrap

You're free to try it out @ https://tu-du-webapp.herokuapp.com/

This is my first project on full-stack web development, actively developed over 2 weeks. All feedback, comments and suggestions are welcome!

Note: To run the code off this repo on your machine, you have to generate your own unique vapid keys required for configuring push notifications, put the public and private keys into 'public_key.txt' and 'private_key.txt' respectively and place those files inside the 'back-end' folder. 

One way to do so (in Linux) is to simply open the terminal inside the 'back-end' folder and run the following commands:

- `openssl ecparam -name prime256v1 -genkey -noout -out vapid_private.pem`
- `openssl ec -in ./vapid_private.pem -outform DER|tail -c +8|head -c 32|base64|tr -d '=' |tr '/+' '_-' >> private_key.txt`
- `openssl ec -in ./vapid_private.pem -pubout -outform DER|tail -c 65|base64|tr -d '=' |tr '/+' '_-' >> public_key.txt`



node.js packages (to be installed inside 'frontend/front-end') in addition to create-react-app:
1. react-bootstrap
2. axios
3. react-router-dom

The proxy on the front-end to the flask back-end is set to the default "http://localhost:5000". You may change it inside 'frontend/front-end/package-json'
