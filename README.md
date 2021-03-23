# localILConsumer

Install git <br> </br>
Install nodejs <br> </br>
Clone the repository at "https://github.com/mHealthKenya/localILConsumer/new/master" into your desired location <br> </br>
cd into the newly created "localILConsumer" folder <br> </br>
Run "npm install" <br> </br>
cd into the "/server/boot" folder <br> </br>
Change the MFL Code in consumer_online.js on line X to reflect the facility's mfl code, also ensure you change the IP address of the IL server on line Y (if it is not running in the same server. Change only the IP address eg "http://127.0.0.1:3007/labresults/sms" to "http://xxx.x.x.x:3007/labresults/sms"" <br> </br>
cd back to the "/server/: folder <br> </br>
run "pm2 start server.js" <br> </br>
go to the IL dashboard, under participating systems
configure the address for T4A (if it is in the same machine as IL, then http://localhost:1440/hl7_message , otherwise it should point to the machine's IP address as seen by the IL machine, so http://{Ushauri IP}:1440/hl7_message)
