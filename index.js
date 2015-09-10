var express = require('express'),
  bodyParser = require('body-parser'),
  formidable = require('formidable'),
  request = require('request'),
  async = require('async'),
  _ = require("underscore"),
  crypto = require('crypto'),
  mimelib = require("mimelib"),
  app = express();


// Enter your api key here
var API_KEY = '';

//Set up the express server
app.use(express.static(__dirname + '/views'));


app.set('port', (process.env.PORT || 1050));
app.use(express.static(__dirname + '/public'));


//Takes the email as string and returns an md5 hash for that user
function createHash(emailName){
  return crypto.createHash('md5').update(emailName).digest('hex');
}

app.post('/incoming', function(req, res){
  var form = new formidable.IncomingForm();
  async.waterfall([
      function parseFormData(callback) {
        form.parse(req, function(err, fields, files){
          if (err) { console.log(err); }

          // Remove all the keys that have "undefined" value
          var propData = _.omit(fields, function(value, key, object){
            if(value == undefined) {
              return true
            }
            else {
              return false
            };
          });    
          
          callback(null, propData);
        });
      },

      //Make a request to threads to idenfiy the user
      function identifyUser(propData, callback){
        var addresses = mimelib.parseAddresses(propData.from);
        
        var userId = createHash(addresses[0].address);
        
        var identifyData = {
          "userId": userId,
          "traits": {
            "name": addresses[0].name,
            "email": addresses[0].address
          }
        };
        request({
          url: 'https://input.threads.io/v1/identify',
          method: 'POST',
          auth: {
            'user': API_KEY,
            'pass': ''
          },
          body: JSON.stringify(identifyData)
        }, function(error, response, body){
          if (error) { console.log(error); }
          else { console.log("identify threads", response.statusCode, body); }

        });
        callback(null, propData, userId)
      },

      function sendEventToThreads(propData, userId, callback){
        // Identify if user exists (based on email)
        // If it does, use the unique ID
        // Else create user and send the data
        // TODO: One way hashing function name/email -> string
        if(propData){
          var eventData = {
            "userId": userId,
            "event": "Email Recieved",
            "properties": propData
          }
          request({
            url: 'https://input.threads.io/v1/track',
            method: 'POST',
            auth: {
              'user': API_KEY,
              'pass': ''
            },
            body: JSON.stringify(eventData)
          }, function(error, response, body){
            if (error) { console.log(error); }
            else { console.log("sendEvent", response.statusCode, body); }
          });
        }
          
          callback(null, 'done');
      }
        
  ], function (err, result) {
      // result now equals 'done'
      res.sendStatus(200);
      res.end();
  });
  //res.end();

  // Send an event to threads
  // userId: from
  // event: "TextRecieved"
  // timestamp: current unix timestamp
  // prop: {sender, content, source-email, source-phone}

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));

});
