# localILConsumer

clone the repository at "https://github.com/mHealthKenya/localILConsumer/new/master" into your desired location
cd into the newly created "localILConsumer" folder
run "npm install"
cd into the "/server/boot" folder
change the MFL Code on line X to reflect the facility's mfl code, also ensure you change the IP address of the IL server on line Y (if it is not running in the same server"
cd back to the "/server/: folder
run "pm2 start server.js"
