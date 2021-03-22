var request = require("request");

var moment = require("moment");



var express = require("express");

var schedule = require("node-schedule");

var connectivity = require("connectivity");

var winston = require("winston");



var DATE_TODAY = moment(new Date()).format("YYYY-MM-DD");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

var express = require("express");

var bodyParser = require("body-parser");



// create a rolling file logger based on date/time that fires process events

var opts = {

	errorEventName: "error",

	logDirectory: "SysLogs", // NOTE: folder must exist and be writable...

	fileNamePattern: "roll-<DATE>.log",

	dateFormat: "YYYY.MM.DD",

};

var log = require("simple-node-logger").createRollingFileLogger(opts);



var applctn = express();

applctn.use(bodyParser.json());


applctn.use(bodyParser.urlencoded({ extended: true }));

module.exports = function (app) {

	applctn.post("/hl7_message", function (req, res) {

		"use strict";



		var hl7_message = (req.body);


	connectivity(function (online) {

			if (online) {

				console.log("connected to the internet!");

				winston.log("info", "connected to the internet!", {

					someKey: "Connection Success",

				});



				log.info(" Connected to the internet! ");



				var options = {

					method: "POST",

					url: "http://il.mhealthkenya.co.ke/hl7_message",

					headers: {

						"Content-Type": "application/json",

					},

					body:hl7_message,

					json: true,

				};



				request(options, function (error, response, body) {

					if (error) throw new Error(error);



					console.log(response);

				});

				res.send(true);

			} else {

				console.error("sorry, not connected!");



				winston.log("info", " No Internet Connection", {

					someKey: "No Transmission. ",

				});



				log.info(" No Internet Connection");

				res.send(false);

			}

		});

	});



	// Tell our app to listen on port 3000

	applctn.listen(1440, function (err) {

		if (err) {

			log.info(err);

		} else {

			console.log("T4A HL7 Consumer Server started on port 1440");

			log.info("T4A HL7 Consumer Server listening on port 1440");

		}

	});



	var j = schedule.scheduleJob("30 * * * * *", function (fireDate) {

		var DATE_TODAY = moment(new Date()).format("YYYY-MM-DD H:m:s");

		console.log(DATE_TODAY);

		console.log(

			"This cron job is supposed to run at => " +

				DATE_TODAY +

				"And FireDate => " +

				fireDate +

				" "

		);



		var getVirals = {

			method: "POST",

			url: "https://mlab.mhealthkenya.co.ke/api/get/il/viral_loads",

			headers: {

				"cache-control": "no-cache",

				"Content-Type": "application/json",

			},

			body: { mfl_code: 14080 },

			json: true,

		};



		request(getVirals, function (error, response, body) {

			if (error) throw new Error(error);

			if (Array.isArray(body)) {

				for (var i = 0; i < body.length; i++) {

					var data = body[i];

					var postToIL = {

						method: "POST",

						url: "http://127.0.0.1:3007/labresults/sms",

						headers: {

							"cache-control": "no-cache",

							"Content-Type": "application/json",

						},

						body: { message: data },

						json: true,

					};



					request(postToIL, function (error, response, res) {

						if (error) throw new Error(error);



						console.log(res);

					});

				}

			} else {

				console.log(body);

			}

		});

	});

};
