var Service = require('node-windows').Service;
 
// Create a new service object
var svc = new Service({
  name:'Ushauri MLAB ToolKit',
  description: 'The mLab T4A HL7 ToolKit.',
  script: 'C:\\Program Files\\mHealth Kenya\\T4A Local ToolKit\\T4A-HL7-Toolkit\\server\\server.js',
});
 
// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});
 
svc.install();