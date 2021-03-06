require("dotenv").config();

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const reports = require("./functions/reports");
const customer = require("./functions/customer");
const config = require("./config");

const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const _dirname = `${__dirname}/public/`;

app.use('/logs', express.static('./logs'));

//add the router
app.use('/', router);
app.listen(process.env.port || 3000);

// get customer json model
router.get('/get.customer',function(req,res){
  try { authorize(customer); }
  catch (e) { console.log(e); }
  res.send("Process in background, view log");
  //res.sendFile(path.join(_dirname+'customer.html'));
  //__dirname : It will resolve to your project folder.
});

// get customer json model
router.get('/get.user',function(req,res){
  try { authorize(reports); }
  catch (e) { console.log(e); }
  res.send("Process in background, view log");
  //res.sendFile(path.join(_dirname+'customer.html'));
  //__dirname : It will resolve to your project folder.
});

//  view customer model
router.get('/view.user',function(req,res){
  res.sendFile(path.join(_dirname+'reports.html'));
});

//  view customer model
router.get('/view.customer',function(req,res){
  res.sendFile(path.join(_dirname+'customer.html'));
});

// days request query into api admin sdk
const data = { days: 100 };

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
const authorize = function(callback) {
  const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URIS
  );

  // Check if we have previously stored a token.
  fs.readFile(config.TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oauth2Client, callback);
    oauth2Client.credentials = JSON.parse(token);
    callback(oauth2Client,  data);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: config.SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client, data);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  fs.writeFile(config.TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) return console.warn(`Token not stored to ${config.TOKEN_PATH}`, err);
    console.log(`Token stored to ${config.TOKEN_PATH}`);
  });
}

// init function
