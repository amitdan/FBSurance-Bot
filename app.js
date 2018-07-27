
/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars *EAAMm8ZBxgnnYBAJnT1pvZCoJHCbs6poHDbFFZBOdU3y0RI7sCvruPeZBamJBiLhhL5hn5bYrGA88COzzZB08KBVZCAqJ2kL1B1R7B3w3fGyWMunz6MVrRC59VEfrGLN5wVZBsAceruB5SnEZAhMZAHwdzz6RZCXZBuzs3VqZCk4YGtXGXQZDZD
 */

'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APIAI_TOKEN = process.env.APIAI_TOKEN;
// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  apiai = require('apiai'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

const apiaiApp = apiai(APIAI_TOKEN);

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
        
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "test1234";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

/* GET query from API.ai */

function sendMessage(sender_psid,received_message) {
  //let sender = event.sender.id;
  let text = received_message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'tabby_cat'
  });

  apiai.on('response', (response) => {
    console.log(response)
    let aiText = response.result.fulfillment.speech;
	let actionIncomplete = response.result.actionIncomplete;
    console.log('1- actionIncomplete: ---------------', actionIncomplete);
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender_psid},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
	
	//
	
	console.log('2- actionIncomplete: ---------------', actionIncomplete);
	if (actionIncomplete === false) {
	     console.log('actionIncomplete: ', actionIncomplete);
	     let travelCost = response.result.parameters.travelCost;
		 let travelStartDate = response.result.parameters.travelStartDate;
		 let travelEndDate = response.result.parameters.travelEndDate;
		 let destinationCountry = response.result.parameters.destinationCountry;	
	     getQuoteAPI(travelStartDate, travelEndDate, destinationCountry, travelCost);	
	}
	
  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}

function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    
	
	sendMessage(sender_psid,received_message);
	
	response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    }
	
	/*
	 response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "I can help you with below options..",
            "subtitle": "Tap a button to answer.",
            
            "buttons": [
              {
                "type": "postback",
                "title": "Get Quote",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "Issue Policy",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
	*/
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
	 callSendAPI(sender_psid, response); 
  } 
  
  // Send the response message
  //callSendAPI(sender_psid, response);    
}

function showMenu(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    //response = { "text": "Thanks!" }
	response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "What is travel start month ? ",
            "subtitle": "Tap a button to answer.",
            "image_url": "https://www.facebook.com/messages/t/1736980056409103", 
            "buttons": [
              {
                "type": "postback",
                "title": "August-2018",
                "payload": "aug",
              },
			  {
                "type": "postback",
                "title": "September-2018",
                "payload": "sept",
              },
			  {
                "type": "postback",
                "title": "Octomber-2018",
                "payload": "oct",
              },
			  {
                "type": "postback",
                "title": "November-2018",
                "payload": "nov",
              },
			  {
                "type": "postback",
                "title": "December-2018",
                "payload": "dec",
              },
              {
                "type": "postback",
                "title": "January-2019",
                "payload": "jan",
              }
            ],
          }]
        }
      }
    }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}


function handlePostback(sender_psid, received_postback) {
  console.log('ok')
   let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
    if (payload === 'yes') {
    //response = { "text": "Thanks!" }
	response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "What is travel start month ? ",
            "subtitle": "Tap a button to answer.",
            
            "buttons": [
              {
                "type": "postback",
                "title": "August-2018",
                "payload": "aug",
              },
			  {
                "type": "postback",
                "title": "September-2018",
                "payload": "sept",
              },
			  {
                "type": "postback",
                "title": "Octomber-2018",
                "payload": "oct",
              }
            ],
          }]
        }
      }
    }
  } 
  else if (payload === 'aug') {
    //response = { "text": "Thanks!" }
	response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "What is travel end month ? ",
            "subtitle": "Tap a button to answer.",
            
            "buttons": [
              {
                "type": "postback",
                "title": "August-2018",
                "payload": "aug-1",
              },
			  {
                "type": "postback",
                "title": "September-2018",
                "payload": "sept",
              },
			  {
                "type": "postback",
                "title": "Octomber-2018",
                "payload": "oct",
              }
            ],
          }]
        }
      }
    }
  } 
  else {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

function getQuoteAPI(travelStartDate, travelEndDate, destinationCountry, travelCost) {

    var solartisRequest = {
    "ServiceRequestDetail": {
    "ServiceRequestVersion": "1.0",
    "ServiceResponseVersion": "1.0",
    "OwnerId": "15",
    "ResponseType": "JSON",
    "RegionCode": "US",
    "Token": "FK8KA9to4/LHKyC28Rsv0wR9i5j3dnrwGQRILW/8MkzAuWoimT7wulJVg3cS+2dW9GeGoqnrLT3ZN44dzwztduSs7X/MgcZvxiqxWRpCzolF8RMcGIsESQs7AvCtLKn7+Pi5HjyBGO/2LwQrVBFGX1sp9faSYo8bbtX89ENdEREse4y3Z1niXChJtel6E5IxhB12xYX8R+5jZevfvFIHMZdk6lkxyHedo2UipPyjN+0mdf87C6sQG8h1r6hKb04LEmXZ1BU3jF61VNK/GgaduY0lMmPL81e6nEBkcH0KIlXTUMLZLozOdpnetxAq8wLxtseNSFd530pMt9CYTG99SFRnH8sd+BgM0Rez5x1HXtJsxmmSocsu7aM6X7h4tRI09ja6eS3YMndyPUCaAIX4r08rFmfeJE/yhxYdN9OrrhKegiqZ0Z5sPWeMUdYjij7ERCWiYO/sCHW7A2SCkiheEh1e/+iRPwub5Etbe6/jv0QHhMUvhbV+fxBIwMZ+h/TpdXaLdBpz+LcK6o/vVDiC7BiJ+X1o/O6u9Bmft39DqDNBPRtZCVXFbjPc6tSBtCqZda6debd6ih5Q7LFl2i3rpMQNYWbPB5hFVVTalEXW8lomy7ibLpvGe50CpdYqy2uiTuDEV2nQK2443AFbAUZkMkSImQ2OLrfqscPDhCdD6wJN3d9rGqIh12WiBMlsHlrYrfN2cawRumUC96m1/sMIK6GPUyTndDmrV0xIXWepGqyW+Q76nzG+KT2qKJ/TT3J4OruCnE4ELmCGfaAD6J6w4ajfyw0ctYsjrnfufI5R4B/gco9z18dSe5OXowbwGT55td9YyEXuURYw4ubWb2LxHFRpYSQ3f5fYn0XsvtG5cghuuteDKqd8xbs93+cv+0aTYdPesM+MuKf+6HYItv+4uR5No8N/ar8RkYgBDxofe2yfxb8+Mrg51+uddbuTXIjJQOdhulWKv+0IR0S8sBeteQ==",
    "UserName": "travelagent",
    "LanguageCode": "en"
  },
  "CustomerInformation": {
    "ProductVerID": "706",
    "ProductID": "619",
    "ProductNumber": "ILT",
    "ProductVerNumber": "1.0",
    "ProducerCode": "86201",
    "OwnerId": "15",
    "PlanName": "Air Ticket Protector",
    "PlanCode": "1",
    "PlanType": "Single Trip",
    "DepartureDate": "11/01/2020",
    "ReturnDate": "11/25/2020",
    "DepositDate": "05/31/2017",
    "DestinationCountry": "France",
    "PolicyEffectiveDate": "11/01/2020",
    "StateCode": "GA",
    "StateName": "Georgia",
    "QuoteType": "New Business",
    "EventName": "CreateCustomer",
    "TravelerList": [
      {
        "TravelerDOB": "02/14/1990",
        "TravelCost": "2500",
        "FirstName": "John",
        "LastName": "Doe",
        "AddressLine1": "399 park avenue",
        "City": "Atlanta",
        "State": "Georgia",
        "StateCode": "GA",
        "Country": "United States",
        "Zipcode": "30301",
        "Phone": "4045555512",
        "Email": "test@solartis.net",
        "TravelerIndex": "1"
      }
    ]
  }
}

     request.post({
      headers: {
        'Content-Type': 'application/json',
        'EventName': 'CreateCustomer',        
        'Token': solartisRequest.ServiceRequestDetail.Token

      },
      url: 'https://travelapihk.solartis.net/DroolsV4_2/DroolsService/FireEventV2',
      body: JSON.stringify(solartisRequest)
    }, (err, httpResponse, body) => {
      if (err) {
        return console.error('err:', err);
        //res.send("sorry there was an error");
      }
      console.log('httpResponse.statusCode', httpResponse.statusCode);
      console.log('body: ', body);
      var solartisResponse = JSON.parse(body);
	  if(solartisResponse.RequestStatus == 'FAILED'){
	    let errorResponse = `Response -  ${solartisResponse.messageDetail.UserMessage}`;
        //res.render('index', {weather: errorResponse, error: null});
      } else {
        let weatherText = `${solartisResponse.CustomerInformation.CustomerReferenceNumber}`;
		console.log('weatherText: ', weatherText);
        //res.render('index', {weather: weatherText, error: null});
      }	  
      }); 
	  
	   var solartisRequest1 = {
    "ServiceRequestDetail": {
    "ServiceRequestVersion": "1.0",
    "ServiceResponseVersion": "1.0",
    "OwnerId": "15",
    "ResponseType": "JSON",
    "RegionCode": "US",
    "Token": "FK8KA9to4/LHKyC28Rsv0wR9i5j3dnrwGQRILW/8MkzAuWoimT7wulJVg3cS+2dW9GeGoqnrLT3ZN44dzwztduSs7X/MgcZvxiqxWRpCzolF8RMcGIsESQs7AvCtLKn7+Pi5HjyBGO/2LwQrVBFGX1sp9faSYo8bbtX89ENdEREse4y3Z1niXChJtel6E5IxhB12xYX8R+5jZevfvFIHMZdk6lkxyHedo2UipPyjN+0mdf87C6sQG8h1r6hKb04LEmXZ1BU3jF61VNK/GgaduY0lMmPL81e6nEBkcH0KIlXTUMLZLozOdpnetxAq8wLxtseNSFd530pMt9CYTG99SFRnH8sd+BgM0Rez5x1HXtJsxmmSocsu7aM6X7h4tRI09ja6eS3YMndyPUCaAIX4r08rFmfeJE/yhxYdN9OrrhKegiqZ0Z5sPWeMUdYjij7ERCWiYO/sCHW7A2SCkiheEh1e/+iRPwub5Etbe6/jv0QHhMUvhbV+fxBIwMZ+h/TpdXaLdBpz+LcK6o/vVDiC7BiJ+X1o/O6u9Bmft39DqDNBPRtZCVXFbjPc6tSBtCqZda6debd6ih5Q7LFl2i3rpMQNYWbPB5hFVVTalEXW8lomy7ibLpvGe50CpdYqy2uiTuDEV2nQK2443AFbAUZkMkSImQ2OLrfqscPDhCdD6wJN3d9rGqIh12WiBMlsHlrYrfN2cawRumUC96m1/sMIK6GPUyTndDmrV0xIXWepGqyW+Q76nzG+KT2qKJ/TT3J4OruCnE4ELmCGfaAD6J6w4ajfyw0ctYsjrnfufI5R4B/gco9z18dSe5OXowbwGT55td9YyEXuURYw4ubWb2LxHFRpYSQ3f5fYn0XsvtG5cghuuteDKqd8xbs93+cv+0aTYdPesM+MuKf+6HYItv+4uR5No8N/ar8RkYgBDxofe2yfxb8+Mrg51+uddbuTXIjJQOdhulWKv+0IR0S8sBeteQ==",
    "UserName": "travelagent",
    "LanguageCode": "en"
  },
  "QuoteInformation": {
    "ProductID": "619",
    "ProductVerID": "706",
    "ProductNumber": "ILT",
    "ProductVerNumber": "1.0",
    "ProducerCode": "86201",
    "OwnerId": "15",
    "PlanName": "Air Ticket Protector",
    "PlanCode": "1",
    "DepartureDate": "06/25/2017",
    "ReturnDate": "06/31/2017",
    "DepositDate": "06/03/2017",
    "DestinationCountry": "France",
    "PolicyEffectiveDate": "06/25/2017",
    "RentalStartDate": "06/25/2017",
    "RentalEndDate": "06/31/2017",
    "RentalLimit": "35000",
    "NumberOfRentalCars": "1",
    "TripCancellationCoverage": "With Trip Cancellation",
    "StateCode": "GA",
    "QuoteType": "New Business",
    "EventName": "InvokeRatingV2",
    "TravelerList": [
      {
        "TravelerDOB": "02/14/1990",
        "TravelCost": "2500"
      }
    ]
  }
}

     request.post({
      headers: {
        'Content-Type': 'application/json',
        'EventName': 'InvokeRatingV2',        
        'Token': solartisRequest1.ServiceRequestDetail.Token

      },
      url: 'https://travelapihk.solartis.net/DroolsV4_2/DroolsService/FireEventV2',
      body: JSON.stringify(solartisRequest1)
    }, (err, httpResponse, body) => {
      if (err) {
        return console.error('err:', err);
        //res.send("sorry there was an error");
      }
      console.log('httpResponse.statusCode', httpResponse.statusCode);
      console.log('body: ', body);
      var solartisResponse1 = JSON.parse(body);
	  
	  let weatherText = `Policy Premium -  ${solartisResponse1.PremiumInformation.TotalBasePremium}`;
      //res.render('index', {weather: weatherText, error: null});
	  console.log('Policy Premium  : ', weatherText);
	  //res.render('index', { statusCode: httpResponse.statusCode, statusMessage: httpResponse.statusMessage });
      });	  
}