'use strict';

module.exports = function (Message) {


    Message.hl7_message = function (req) {


        console.log(req.body);
    }

    Message.remoteMethod(
            'hl7_message', {
                http: {
                    path: '/hl7_message',
                    verb: 'post',
                    status: 200,
                    errorStatus: 400
                },
                accepts: [{type: 'object', http: {source: 'body'}}],
                description: ["HL7 Message Consumer"],
                returns: {
                    arg: 'status',
                    type: 'string'
                }
            }
    );




};