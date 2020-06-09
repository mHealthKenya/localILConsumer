/*
 In the node.js intro tutorial (http://nodejs.org/), they show a basic tcp
 server, but for some reason omit a client connecting to it.  I added an
 example at the bottom.
 Save the following server in example.js:
 */
//var db = require('./dbconnection'); //reference of dbconnection.js
var request = require('request');
var moment = require('moment');
var execPhp = require('exec-php');
var express = require('express');
var schedule = require('node-schedule');
var forEach = require('async-foreach').forEach;
var connectivity = require('connectivity');
var encode = require('nodejs-base64-encode');
var winston = require('winston');

var DATE_TODAY = moment(new Date()).format("YYYY-MM-DD");

var express = require('express');
var bodyParser = require('body-parser');

var short_code = "40146";
var facility_phone_no = '0795030494';

// create a rolling file logger based on date/time that fires process events
var opts = {
    errorEventName: 'error',
    logDirectory: 'SysLogs', // NOTE: folder must exist and be writable...
    fileNamePattern: 'roll-<DATE>.log',
    dateFormat: 'YYYY.MM.DD'
};
var log = require('simple-node-logger').createRollingFileLogger(opts);

var applctn = express();
applctn.use(bodyParser.json());

module.exports = function (app) {

    applctn.post('/hl7_message', function (req, res) {
        'use strict';

        var hl7_message = JSON.stringify(req.body);

        connectivity(function (online) {
            if (online) {
                console.log('connected to the internet!');
                winston.log('info', 'connected to the internet!', {
                    someKey: 'Connection Success'
                });

                log.info(" Connected to the internet! ");

                var options = {method: 'POST',
                    url: 'http://il.mhealthkenya.co.ke/hl7_message',
                    headers:
                            {'Postman-Token': '4fef941c-d16d-4592-bae6-d62bfa2fcac8',
                                'cache-control': 'no-cache',
                                'Content-Type': 'application/json'},
                    body: hl7_message,
                    json: true};

                request(options, function (error, response, body) {
                    if (error)
                        throw new Error(error);

                    console.log(body);
                });

            } else {
                console.error('sorry, not connected!');

                winston.log('info', " No Internet Connection  , opt for SMS Option ", {
                    someKey: 'SMS Transmission. '
                });

                log.info(" No Internet Connection  , opt for SMS Option ");

                process_offline_msg(hl7_message);

                res.send("Success , received the offline message ");

            }
        });

    });

    // Tell our app to listen on port 3000
    applctn.listen(1440, function (err) {
        if (err) {
            log.info(err);

        } else {

            console.log('T4A HL7 Consumer Server started on port 1440');
            log.info('T4A HL7 Consumer Server listening on port 1440');
 
        }

    });

    var j = schedule.scheduleJob('30 * * * * *', function (fireDate) {
        var DATE_TODAY = moment(new Date()).format("YYYY-MM-DD H:m:s");
        console.log(DATE_TODAY);
        console.log('This cron job is supposed to run at => ' + DATE_TODAY + "And FireDate => " + fireDate + " ");

        execPhp('C:\\xampp\\htdocs\\hilink-modem\\sms_gateway.php', 'C:\\xampp\\php\\php.exe', function (error, php, output) {

            php.get_messages(function (error, result, output, printed) {

                log.info(result);
            });
        });
    });

}

function process_offline_msg(message) {

    var DATE_TODAY = moment(new Date()).format("YYYY-MM-DD H:m:s");
    var today = moment(new Date()).format("YYYY-MM-DD");
    var MessageTo = short_code;
    var MessageFrom = facility_phone_no;

    var jsonObj;

    try {
        jsonObj = JSON.parse(message.replace(/\||~/g, ''));

        var message_type = jsonObj.MESSAGE_HEADER.MESSAGE_TYPE;
        var SENDING_APPLICATION = jsonObj.MESSAGE_HEADER.SENDING_APPLICATION;
        var SENDING_FACILITY = jsonObj.MESSAGE_HEADER.SENDING_FACILITY;
        var MESSAGE_DATETIME = jsonObj.MESSAGE_HEADER.MESSAGE_DATETIME;
        var MARITAL_STATUS;
        var STATUS;
        var GENDER;
        var GROUP_ID;
        var GODS_NUMBER;

        if (jsonObj.MESSAGE_HEADER) {

            MESSAGE_TYPE = jsonObj.MESSAGE_HEADER.MESSAGE_TYPE;
            if (MESSAGE_TYPE == "ADT^A04") {
                console.log("MESSAGE TYPE => " + MESSAGE_TYPE);
                SENDING_APPLICATION = jsonObj.MESSAGE_HEADER.SENDING_APPLICATION;
                var EXTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.EXTERNAL_PATIENT_ID;
                var INTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID;
                var PATIENT_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME;
                var MOTHER_NAME = jsonObj.PATIENT_IDENTIFICATION.MOTHER_NAME;

                if (EXTERNAL_PATIENT_ID) {
                    for (var i in EXTERNAL_PATIENT_ID) {

                    }
                }

                if (INTERNAL_PATIENT_ID) {
                    for (var i in INTERNAL_PATIENT_ID) {

                        if (INTERNAL_PATIENT_ID[i]) {

                            var IDENTIFIER_TYPE = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].IDENTIFIER_TYPE;

                            if (IDENTIFIER_TYPE == "CCC_NUMBER") {
                                var CCC_NUMBER = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }
                            if (IDENTIFIER_TYPE == "NATIONAL_ID") {
                                var NATIONAL_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }

                        }
                    }
                }

                if (PATIENT_NAME) {

                    var FIRST_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.FIRST_NAME;
                    var MIDDLE_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.MIDDLE_NAME;
                    var LAST_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.LAST_NAME;

                }

                if (MOTHER_NAME) {
                    var MOTHER_FIRST_NAME = MOTHER_NAME.FIRST_NAME;
                    var MOTHER_MIDDLE_NAME = MOTHER_NAME.MIDDLE_NAME;
                    var MOTHER_LAST_NAME = MOTHER_NAME.LAST_NAME;

                }

                var DOB = jsonObj.PATIENT_IDENTIFICATION.DATE_OF_BIRTH;

                var year = DOB.substring(0, 4);
                var month = DOB.substring(4, 6);
                var day = DOB.substring(6, 8);

                DOB = year + '-' + month + '-' + day;

                var today = DATE_TODAY;

                var date_diff = moment(today).diff(DOB, 'days');

                DATE_OF_BIRTH = DOB;

                if (date_diff >= 5475 && date_diff <= 6935) {
                    GROUP_ID = "2";
                }
                if (date_diff >= 7300) {
                    GROUP_ID = "1";
                }
                if (date_diff <= 5110) {
                    GROUP_ID = "6";
                }

                var SEX = jsonObj.PATIENT_IDENTIFICATION.SEX;
                var PATIENT_ADDRESS = jsonObj.PATIENT_IDENTIFICATION.PATIENT_ADDRESS;

                if (typeof (PATIENT_ADDRESS) == 'object') {
                    for (var y in PATIENT_ADDRESS) {
                        var PHYSICAL_ADDRESS = PATIENT_ADDRESS[y];
                        if (typeof (PHYSICAL_ADDRESS) == 'object') {
                            for (var w in PHYSICAL_ADDRESS) {

                            }
                        } else {

                        }
                    }
                }

                PHONE_NUMBER = jsonObj.PATIENT_IDENTIFICATION.PHONE_NUMBER;

                var DEATH_DATE = jsonObj.PATIENT_IDENTIFICATION.DEATH_DATE;

                var year = DEATH_DATE.substring(0, 4);
                var month = DEATH_DATE.substring(4, 6);
                var day = DEATH_DATE.substring(6, 8);

                DEATH_DATE = year + '-' + month + '-' + day;

                var DEATH_INDICATOR = jsonObj.PATIENT_IDENTIFICATION.DEATH_INDICATOR;
                if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "D") {
                    MARITAL_STATUS = "3";
                } else
                if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "S") {
                    MARITAL_STATUS = "1";
                } else
                if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "MP") {
                    MARITAL_STATUS = "6";
                } else
                if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "MM") {
                    MARITAL_STATUS = "2";
                } else
                if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "W") {
                    MARITAL_STATUS = "4";
                } else
                if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "C") {
                    MARITAL_STATUS = "5";
                } else {
                    MARITAL_STATUS = "1";
                }

                if (jsonObj.PATIENT_IDENTIFICATION.DEATH_INDICATOR == "N") {
                    STATUS = "Active";
                } else if (jsonObj.PATIENT_IDENTIFICATION.DEATH_INDICATOR == "Y") {
                    STATUS = "Dead";
                } else {
                    STATUS = "Active";
                }
                if (jsonObj.PATIENT_IDENTIFICATION.SEX == "F") {
                    GENDER = "1";
                } else if (jsonObj.PATIENT_IDENTIFICATION.SEX == "M") {
                    GENDER = "2";
                }

                var NOK_FIRST_NAME;
                var NOK_MIDDLE_NAME;
                var NOK_LAST_NAME;
                var NOK_PHONE_NUMBER;
                var NEXT_OF_KIN = jsonObj.NEXT_OF_KIN;
                if (typeof (NEXT_OF_KIN) == "object") {
                    for (var q in NEXT_OF_KIN) {

                        NOK_FIRST_NAME = jsonObj.NEXT_OF_KIN[q].NOK_NAME.FIRST_NAME;

                        NOK_MIDDLE_NAME = jsonObj.NEXT_OF_KIN[q].NOK_NAME.MIDDLE_NAME;
                        NOK_LAST_NAME = jsonObj.NEXT_OF_KIN[q].NOK_NAME.LAST_NAME;
                        var NOK_RELATIONSHIP = jsonObj.NEXT_OF_KIN[q].RELATIONSHIP;
                        var NOK_ADDRESS = jsonObj.NEXT_OF_KIN[q].ADDRESS;
                        NOK_PHONE_NUMBER = jsonObj.NEXT_OF_KIN[q].PHONE_NUMBER;
                        var NOK_SEX = jsonObj.NEXT_OF_KIN[q].SEX;
                        var NOK_DATE_OF_BIRTH = jsonObj.NEXT_OF_KIN[q].DATE_OF_BIRTH;
                        var NOK_CONTACT_ROLE = jsonObj.NEXT_OF_KIN[q].CONTACT_ROLE;

                    }
                }
                var PATIENT_VISIT = jsonObj.PATIENT_VISIT;
                var VISIT_DATE = jsonObj.PATIENT_VISIT.VISIT_DATE;
                var PATIENT_TYPE = jsonObj.PATIENT_VISIT.PATIENT_TYPE;
                var PATIENT_SOURCE = jsonObj.PATIENT_VISIT.PATIENT_SOURCE;
                var HIV_CARE_ENROLLMENT_DATE = jsonObj.PATIENT_VISIT.HIV_CARE_ENROLLMENT_DATE;

                var year = HIV_CARE_ENROLLMENT_DATE.substring(0, 4);
                var month = HIV_CARE_ENROLLMENT_DATE.substring(4, 6);
                var day = HIV_CARE_ENROLLMENT_DATE.substring(6, 8);

                HIV_CARE_ENROLLMENT_DATE = year + '-' + month + '-' + day;

                var NOK_NAME = NOK_FIRST_NAME + " " + NOK_MIDDLE_NAME + " " + NOK_LAST_NAME;
                //FORMULATE THE  ENCRYPTED TEXT MESSAGE
                //CCC NUMBER * FIRST NAME * MIDDLE NAME * LAST NAME * DATE OF BIRTH * GENDER *  MARITAL STATUS * CONDITION (ART/PRE-ART) * ENROLLMENT DATE * ART START DATE * PHONE NO * LANGUAGE * SMS ENABLE * MOTIVATIONAL ENABLE ALERTS * MESSAGING TIME * CLIENT STATUS * TRANSACTION STATUS

                var Patient_Registration = "" + CCC_NUMBER + "*" + FIRST_NAME + "*" + MIDDLE_NAME + "*" + LAST_NAME + "*" + DATE_OF_BIRTH + "*" + GENDER + "*" + MARITAL_STATUS + "*No Condition*" + HIV_CARE_ENROLLMENT_DATE + "*0*" + PHONE_NUMBER + "*5*2*2*10*" + STATUS + "*1*" + SENDING_APPLICATION + "*" + DEATH_INDICATOR;
                var encoded_patient_registration = encode.encode(Patient_Registration, 'base64');
                var encoded_msg = "IL_ADT*" + encoded_patient_registration;
                log.info(encoded_msg);

                console.log(MessageTo);
                console.log(encoded_msg);

                execPhp('C:\\xampp\\htdocs\\hilink-modem\\sendmessage.php', 'C:\\xampp\\php\\php.exe', function (error, php, output) {

                    php.send_message(MessageTo, encoded_msg, function (error, result, output, printed) {

                        log.info(result);
                    });
                });

                var HL7_MESSAGE_SQL = "INSERT INTO t4a_local.messageout (MessageTo,MessageFrom,MessageText) VALUES ('" + MessageTo + "','" + MessageFrom + "','" + encoded_msg + "')";

                console.log(HL7_MESSAGE_SQL);

            } else if (MESSAGE_TYPE == "ADT^A08") {

                console.log('ADT^A08 => Patient Update....');

                SENDING_APPLICATION = jsonObj.MESSAGE_HEADER.SENDING_APPLICATION;
                var EXTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.EXTERNAL_PATIENT_ID;
                var INTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID;
                var PATIENT_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME;
                var MOTHER_NAME = jsonObj.PATIENT_IDENTIFICATION.MOTHER_NAME;

                if (EXTERNAL_PATIENT_ID) {
                    for (var i in EXTERNAL_PATIENT_ID) {
                        //console.log(EXTERNAL_PATIENT_ID[i]);

                        if (IDENTIFIER_TYPE == "GODS_NUMBER") {
                            GODS_NUMBER = jsonObj.PATIENT_IDENTIFICATION.EXTERNAL_PATIENT_ID[i].ID;
                            //console.log("CCC NUMBER => " + CCC_NUMBER);
                        }

                    }
                }

                if (INTERNAL_PATIENT_ID) {
                    for (var i in INTERNAL_PATIENT_ID) {

                        if (INTERNAL_PATIENT_ID[i]) {

                            var IDENTIFIER_TYPE = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].IDENTIFIER_TYPE;

                            if (IDENTIFIER_TYPE == "CCC_NUMBER") {
                                var CCC_NUMBER = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }
                            if (IDENTIFIER_TYPE == "NATIONAL_ID") {
                                var NATIONAL_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }

                        }
                    }
                }

                if (PATIENT_NAME) {

                    var FIRST_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.FIRST_NAME;
                    var MIDDLE_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.MIDDLE_NAME;
                    var LAST_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.LAST_NAME;

                }

                if (MOTHER_NAME) {
                    var MOTHER_FIRST_NAME = MOTHER_NAME.FIRST_NAME;
                    var MOTHER_MIDDLE_NAME = MOTHER_NAME.MIDDLE_NAME;
                    var MOTHER_LAST_NAME = MOTHER_NAME.LAST_NAME;

                }

                var DOB = jsonObj.PATIENT_IDENTIFICATION.DATE_OF_BIRTH;

                var DOB = jsonObj.PATIENT_IDENTIFICATION.DATE_OF_BIRTH;

                var year = DOB.substring(0, 4);
                var month = DOB.substring(4, 6);
                var day = DOB.substring(6, 8);

                DOB = year + '-' + month + '-' + day;

                var today = DATE_TODAY;

                var date_diff = moment(today).diff(DOB, 'days');

                DATE_OF_BIRTH = DOB;

                if (date_diff >= 5475 && date_diff <= 6935) {
                    GROUP_ID = "2";
                }
                if (date_diff >= 7300) {
                    GROUP_ID = "1";
                }
                if (date_diff <= 5110) {
                    GROUP_ID = "6";
                }

                var SEX = jsonObj.PATIENT_IDENTIFICATION.SEX;
                var PATIENT_ADDRESS = jsonObj.PATIENT_IDENTIFICATION.PATIENT_ADDRESS;

                if (typeof (PATIENT_ADDRESS) == 'object') {
                    for (var y in PATIENT_ADDRESS) {
                        var PHYSICAL_ADDRESS = PATIENT_ADDRESS[y];
                        if (typeof (PHYSICAL_ADDRESS) == 'object') {
                            for (var w in PHYSICAL_ADDRESS) {

                            }
                        } else {

                        }
                    }
                }
                PHONE_NUMBER = jsonObj.PATIENT_IDENTIFICATION.PHONE_NUMBER;

                var DEATH_DATE = jsonObj.PATIENT_IDENTIFICATION.DEATH_DATE;
                var DEATH_INDICATOR = jsonObj.PATIENT_IDENTIFICATION.DEATH_INDICATOR;
                if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "D") {
                    var MARITAL_STATUS = "3";
                } else if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "S") {
                    var MARITAL_STATUS = "1";
                } else if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "MP") {
                    var MARITAL_STATUS = "6";
                } else if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "MM") {
                    var MARITAL_STATUS = "2";
                } else if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "W") {
                    var MARITAL_STATUS = "4";
                } else if (jsonObj.PATIENT_IDENTIFICATION.MARITAL_STATUS == "C") {
                    var MARITAL_STATUS = "5";
                } else {
                    var MARITAL_STATUS = "1";
                }

                if (jsonObj.PATIENT_IDENTIFICATION.DEATH_INDICATOR == "N") {
                    var STATUS = "Active";
                } else if (jsonObj.PATIENT_IDENTIFICATION.DEATH_INDICATOR == "Y") {
                    var STATUS = "Dead";
                } else {
                    var STATUS = "Active";
                }
                if (jsonObj.PATIENT_IDENTIFICATION.SEX == "F") {
                    var GENDER = "1";
                } else if (jsonObj.PATIENT_IDENTIFICATION.SEX == "M") {
                    var GENDER = "2";
                } else {
                    var GENDER = "2";
                }

                var NEXT_OF_KIN = jsonObj.NEXT_OF_KIN;
                if (typeof (NEXT_OF_KIN) == "object") {
                    for (var q in NEXT_OF_KIN) {

                        var NOK_FIRST_NAME = jsonObj.NEXT_OF_KIN[q].NOK_NAME.FIRST_NAME;

                        var NOK_MIDDLE_NAME = jsonObj.NEXT_OF_KIN[q].NOK_NAME.MIDDLE_NAME;
                        var NOK_LAST_NAME = jsonObj.NEXT_OF_KIN[q].NOK_NAME.LAST_NAME;
                        var NOK_RELATIONSHIP = jsonObj.NEXT_OF_KIN[q].RELATIONSHIP;
                        var NOK_ADDRESS = jsonObj.NEXT_OF_KIN[q].ADDRESS;
                        var NOK_PHONE_NUMBER = jsonObj.NEXT_OF_KIN[q].PHONE_NUMBER;
                        var NOK_SEX = jsonObj.NEXT_OF_KIN[q].SEX;
                        var NOK_DATE_OF_BIRTH = jsonObj.NEXT_OF_KIN[q].DATE_OF_BIRTH;
                        var NOK_CONTACT_ROLE = jsonObj.NEXT_OF_KIN[q].CONTACT_ROLE;

                    }
                }

                var PATIENT_VISIT = jsonObj.PATIENT_VISIT;
                var VISIT_DATE;
                var PATIENT_TYPE;
                var PATIENT_SOURCE;
                var HIV_CARE_ENROLLMENT_DATE;
                var PATIENT_VISIT = jsonObj.PATIENT_VISIT;
                var VISIT_DATE = jsonObj.PATIENT_VISIT.VISIT_DATE;

                var PATIENT_TYPE = jsonObj.PATIENT_VISIT.PATIENT_TYPE;
                var PATIENT_SOURCE = jsonObj.PATIENT_VISIT.PATIENT_SOURCE;
                var HIV_CARE_ENROLLMENT_DATE = jsonObj.PATIENT_VISIT.HIV_CARE_ENROLLMENT_DATE;

                var year = HIV_CARE_ENROLLMENT_DATE.substring(0, 4);
                var month = HIV_CARE_ENROLLMENT_DATE.substring(4, 6);
                var day = HIV_CARE_ENROLLMENT_DATE.substring(6, 8);

                HIV_CARE_ENROLLMENT_DATE = year + '-' + month + '-' + day;

                var NOK_NAME = NOK_FIRST_NAME + " " + NOK_MIDDLE_NAME + " " + NOK_LAST_NAME;

                //FORMULATE THE  ENCRYPTED UPDATE MESSAGE .....
                //CCC NUMBER * FIRST NAME * MIDDLE NAME * LAST NAME * DATE OF BIRTH * GENDER *  MARITAL STATUS * CONDITION (ART/PRE-ART) * ENROLLMENT DATE * ART START DATE * PHONE NO * LANGUAGE * SMS ENABLE * MOTIVATIONAL ENABLE ALERTS * MESSAGING TIME * CLIENT STATUS * TRANSACTION STATUS

                var Patient_Update = " " + CCC_NUMBER + "*" + FIRST_NAME + "*" + MIDDLE_NAME + "*" + LAST_NAME + "*" + DATE_OF_BIRTH + "*" + GENDER + "*" + MARITAL_STATUS + "*No Condition*" + HIV_CARE_ENROLLMENT_DATE + "**" + PHONE_NUMBER + "*5*2*2*10*" + STATUS + "*2*" + SENDING_APPLICATION + "*" + DEATH_INDICATOR;
                var encoded_patient_registration = encode.encode(Patient_Update, 'base64');
                var encoded_msg = "IL_ADT*" + encoded_patient_registration;

                log.info(encoded_msg);

                execPhp('C:\\xampp\\htdocs\\hilink-modem\\sendmessage.php', 'C:\\xampp\\php\\php.exe', function (error, php, output) {

                    php.send_message(MessageTo, encoded_msg, function (error, result, output, printed) {

                        log.info(result);
                    });
                });

            } else if (MESSAGE_TYPE == "ORU^R01") {

                SENDING_APPLICATION = jsonObj.MESSAGE_HEADER.SENDING_APPLICATION;
                var EXTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.EXTERNAL_PATIENT_ID;
                var INTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID;
                var PATIENT_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME;
                var MOTHER_NAME = jsonObj.PATIENT_IDENTIFICATION.MOTHER_NAME;
                var CCC_NUMBER;
                var NATIONAL_ID;

                if (EXTERNAL_PATIENT_ID) {
                    for (var i in EXTERNAL_PATIENT_ID) {

                    }
                }

                if (INTERNAL_PATIENT_ID) {
                    for (var i in INTERNAL_PATIENT_ID) {

                        if (INTERNAL_PATIENT_ID[i]) {

                            var IDENTIFIER_TYPE = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].IDENTIFIER_TYPE;

                            if (IDENTIFIER_TYPE == "CCC_NUMBER") {
                                CCC_NUMBER = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }
                            if (IDENTIFIER_TYPE == "NATIONAL_ID") {
                                NATIONAL_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }

                        }
                    }
                }

                if (PATIENT_NAME) {

                    var FIRST_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.FIRST_NAME;
                    var MIDDLE_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.MIDDLE_NAME;
                    var LAST_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME.FIRST_NAME;

                }

                var OBSERVATION_IDENTIFIER;

                var OBSERVATION_SUB_ID;
                var CODING_SYSTEM;
                var VALUE_TYPE;
                var OBSERVATION_VALUE;
                var UNITS;
                var OBSERVATION_RESULT_STATUS;
                var OBSERVATION_DATETIME;
                var ABNORMAL_FLAGS;
                var oru_insert_sql;

                var OBSERVATION_RESULT = jsonObj.OBSERVATION_RESULT;
                if (OBSERVATION_RESULT) {

                    forEach(OBSERVATION_RESULT, function (item, index) {

                        OBSERVATION_IDENTIFIER = item.OBSERVATION_IDENTIFIER;
                        OBSERVATION_IDENTIFIER = item.OBSERVATION_IDENTIFIER;
                        OBSERVATION_SUB_ID = item.OBSERVATION_SUB_ID;
                        CODING_SYSTEM = item.CODING_SYSTEM;
                        VALUE_TYPE = item.VALUE_TYPE;
                        OBSERVATION_VALUE = item.OBSERVATION_VALUE;
                        UNITS = item.UNITS;
                        OBSERVATION_RESULT_STATUS = item.OBSERVATION_RESULT_STATUS;
                        OBSERVATION_DATETIME = item.OBSERVATION_DATETIME;
                        ABNORMAL_FLAGS = item.ABNORMAL_FLAGS;

                        var today = moment(new Date()).format("YYYY-MM-DD");
                        //ORU MESSAGE => OBSERVATION IDENTIFIER * VALUE TYPE * OBSERVATION VALUE
                        var ORU_MESSAGE = "" + OBSERVATION_IDENTIFIER + "*" + VALUE_TYPE + "*" + OBSERVATION_VALUE + "*" + SENDING_APPLICATION;

                        var ENCODED_ORU_MESSAGE = encode.encode(ORU_MESSAGE, 'base64');
                        var encoded_msg = "IL_ORU*" + ENCODED_ORU_MESSAGE;
                        log.info(encoded_msg);

                        if (OBSERVATION_IDENTIFIER == "ART_START") {
                            //Update tbl_client and set client condition to ART ,else leave it at Pre-ART
                            var ART_START_DATE;

                            var year = OBSERVATION_VALUE.substring(0, 4);
                            var month = OBSERVATION_VALUE.substring(4, 6);
                            var day = OBSERVATION_VALUE.substring(6, 8);

                            OBSERVATION_VALUE = year + '-' + month + '-' + day;

                            var ORU_MESSAGE = "" + OBSERVATION_IDENTIFIER + "*" + VALUE_TYPE + "*" + OBSERVATION_VALUE + "*" + SENDING_APPLICATION;

                            var ENCODED_ORU_MESSAGE = encode.encode(ORU_MESSAGE, 'base64');
                            var encoded_msg = "IL_ORU_ART*" + ENCODED_ORU_MESSAGE;
                            console.log(encoded_msg);

                        }

                        execPhp('C:\\xampp\\htdocs\\hilink-modem\\sendmessage.php', 'C:\\xampp\\php\\php.exe', function (error, php, output) {

                            php.send_message(MessageTo, encoded_msg, function (error, result, output, printed) {

                                log.info(result);
                            });
                        });

                        //FORMULATE THE ENCRYPTED ORU MESSAGE ...
                        //ORU MESSAGE => OBSERVATION IDENTIFIER * VALUE TYPE * OBSERVATION VALUE

                    });

                }

            } else if (MESSAGE_TYPE === "SIU^S12") {

                console.log('SIU^S128 => Appointment Scheduling....');

                var CCC_NUMBER;

                SENDING_APPLICATION = jsonObj.MESSAGE_HEADER.SENDING_APPLICATION;
                var EXTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.EXTERNAL_PATIENT_ID;
                var INTERNAL_PATIENT_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID;
                var PATIENT_NAME = jsonObj.PATIENT_IDENTIFICATION.PATIENT_NAME;
                var MOTHER_NAME = jsonObj.PATIENT_IDENTIFICATION.MOTHER_NAME;

                if (EXTERNAL_PATIENT_ID) {
                    for (var i in EXTERNAL_PATIENT_ID) {
                        console.log(EXTERNAL_PATIENT_ID[i]);
                    }
                }

                if (INTERNAL_PATIENT_ID) {
                    for (var i in INTERNAL_PATIENT_ID) {

                        if (INTERNAL_PATIENT_ID[i]) {

                            var IDENTIFIER_TYPE = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].IDENTIFIER_TYPE;

                            if (IDENTIFIER_TYPE == "CCC_NUMBER") {
                                CCC_NUMBER = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }
                            if (IDENTIFIER_TYPE == "NATIONAL_ID") {
                                var NATIONAL_ID = jsonObj.PATIENT_IDENTIFICATION.INTERNAL_PATIENT_ID[i].ID;

                            }

                        }
                    }
                }

                var APPOINTMENT_INFORMATION = jsonObj.APPOINTMENT_INFORMATION;

                if (APPOINTMENT_INFORMATION) {
                    for (var i in APPOINTMENT_INFORMATION) {
                        var PLACER_APPOINTMENT_NUMBER = APPOINTMENT_INFORMATION[i].PLACER_APPOINTMENT_NUMBER;

                        var NUMBER = PLACER_APPOINTMENT_NUMBER.NUMBER;
                        var ENTITY = PLACER_APPOINTMENT_NUMBER.ENTITY;

                        var APPOINTMENT_REASON = APPOINTMENT_INFORMATION[i].APPOINTMENT_REASON;
                        var APPOINTMENT_TYPE = APPOINTMENT_INFORMATION[i].APPOINTMENT_TYPE;
                        var APPOINTMENT_DATE = APPOINTMENT_INFORMATION[i].APPOINTMENT_DATE;
                        var APPOINTMENT_PLACING_ENTITY = APPOINTMENT_INFORMATION[i].APPOINTMENT_PLACING_ENTITY;
                        var APPOINTMENT_LOCATION = APPOINTMENT_INFORMATION[i].APPOINTMENT_LOCATION;
                        var ACTION_CODE = APPOINTMENT_INFORMATION[i].ACTION_CODE;
                        var APPOINTMENT_NOTE = APPOINTMENT_INFORMATION[i].APPOINTMENT_NOTE;
                        var APPOINTMENT_HONORED = APPOINTMENT_INFORMATION[i].APPINTMENT_HONORED;

                        var year = APPOINTMENT_DATE.substring(0, 4);
                        var month = APPOINTMENT_DATE.substring(4, 6);
                        var day = APPOINTMENT_DATE.substring(6, 8);

                        APPOINTMENT_DATE = year + '-' + month + '-' + day;

                        // FORMULATE THE ENCRYPTED APPOINTMENT MESSAGE ...
                        //SIU  MESSAGE => CCC NUMBER * APPOINTMENT DATE * APPOINYMENT TYPE * APPOINTMENT LOCATION *ACTION CODE *  APPOINTMENT NOTE *APPOINTMENT HONORED * APPOINTMENT REASON
                        var APPOINTMENT_MESSAGE = "" + CCC_NUMBER + "*" + APPOINTMENT_DATE + "*" + APPOINTMENT_TYPE + "*" + APPOINTMENT_LOCATION + "*" + ACTION_CODE + "*" + APPOINTMENT_NOTE + "*" + APPOINTMENT_HONORED + "*" + APPOINTMENT_REASON + "*" + SENDING_APPLICATION;

                        var encoded_APPOINTMENT_MESSAGE = encode.encode(APPOINTMENT_MESSAGE, 'base64');
                        var encoded_msg = "IL_SIU*" + encoded_APPOINTMENT_MESSAGE;
                        log.info(encoded_msg);

                        execPhp('C:\\xampp\\htdocs\\hilink-modem\\sendmessage.php', 'C:\\xampp\\php\\php.exe', function (error, php, output) {

                            php.send_message(MessageTo, encoded_msg, function (error, result, output, printed) {

                                log.info(result);
                            });
                        });

                    }
                }

            }

        } else {

        }

    } catch (e) {

        console.log("Error , message is not a JSON Object" + e);

        log.info("Error , message is not a JSON Object" + e);

        winston.log('error', "Error , message is not a JSON Object" + e, {
            someKey: 'Error Message not a JSON . '
        });
    }

}
