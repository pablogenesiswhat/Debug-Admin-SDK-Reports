const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const dateFormat = require("dateformat");

const SCOPES = [
    "https://www.googleapis.com/auth/admin.reports.audit.readonly",
    "https://www.googleapis.com/auth/admin.reports.usage.readonly"
];

const data = {
  days: 50
};

// Token path
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.error('Error loading client secret file', err);

  // Authorize a client with the loaded credentials, then call the
  // Reports API.
  authorize(JSON.parse(content), listUsage);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
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
    scope: SCOPES,
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
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
    console.log(`Token stored to ${TOKEN_PATH}`);
  });
}


// ---------------------------- Reporte de actividad de uso -----------------------------------
/**
 * Public Function
 * Function listUsage(auth, data) : null
 *
 * @param auth => token autorizacion expedido por google API
 * @param object data{
 *    data.days number - default config.REPORTS.DAYS
 *    data.dataset string - default config.DEFAULT_DATASET
 * }
 *
 * Generador de reporte de uso por numero de dias.
 * Este reporte incluye toda la gama de informacion por cada usuario segun esquema
 */
function listUsage(auth, data, callback) {
  const days = (data.days || 50) + 2;

  const service = google.admin({ version: "reports_v1", auth });
  let now = new Date();

  // Days
  const x = 3;

  // Counts results
  let warningCount = 0;
  let completeCount = 0;
  let dateInit = "";
  let dateEnd = "";

  let params = {
    userKey: "all",
    date: "",
    maxResults: 1000,
    pageToken: undefined
  };

  // Funcion recursiva
  const nexToken = function(d) {
    if (days >= d) {

      let oneWeekAgo = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      let date = dateFormat(oneWeekAgo, "yyyy-mm-dd");
      params.date = date;

      if (d == x) dateInit = date;
      dateEnd = date;

      service.userUsageReport.get(params, (err, res) => {
        if (err)
          if (callback) return callback({ err: err });
          else return console.error(err);
        // page token
        params.pageToken = res.data.nextPageToken;

        // warning
        if (res.data.warnings)
          if (callback)
            return callback({
              res: res.data.warnings,
              status: false, day: date
            });
          else {
            warningCount++;
            console.info("\n Warning");
            console.error({
              date: date,
              response: res.data.etag,
              message: res.data.warnings
              //usage: res.data.usageReports
            });

            if (res.data.nextPageToken) nexToken(d);
            else {
              d++;
              if (!(days >= d)) callback(resInsert);
              else nexToken(d);
            }
          }
        else {
          let items = res.data.usageReports;

          completeCount++;
          if (items) {
            console.info(`\n Data Complete`);
            console.info({ response: date, complete: true });

            if (res.data.nextPageToken) nexToken(d);
            else {
              d++;
              if (!(days >= d)) {
                if (callback) callback(items);
                nexToken(d);
              }
              else nexToken(d);
            }
          }
        }
      });
    } else {
      if (callback) callback();
      else console.log(`\nData Complete: ${completeCount}\nWarnings: ${warningCount}\nDays counted: ${(days-d-1)+days}\nDate Init: ${dateInit}\nDate End: ${dateEnd}`);
    }
  };

  nexToken(x);
}
