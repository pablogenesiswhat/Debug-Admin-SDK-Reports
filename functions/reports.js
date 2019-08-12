const {google} = require('googleapis');
const dateFormat = require("dateformat");
const Json = require("../module/jsonFile");

// create element json output
const json = new Json();

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
module.exports = function (auth, data, callback) {
  console.log("Init Reports User Usage Process");
  const days = (data.days || 50) + 2;

  const service = google.admin({ version: "reports_v1", auth });
  let now = new Date();

  // Days
  const x = 3;
  // array save output
  const arrSave = [];

  // Counts results
  let warningCount = 0;
  let completeCount = 0;
  let dateInit = "";
  let dateEnd = "";
  const daysCounted = days - x + 1;

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
            const output = {
              date: date,
              response: res.data.etag,
              message: res.data.warnings
              //usage: res.data.usageReports
            }

            console.error(output);

            arrSave.push({ Warrning: warningCount, values: output});

            if (res.data.nextPageToken) nexToken(d);
            else {
              d++;
              if (!(days >= d)) {
                if (callback)
                  callback();
                else nexToken();
              }
              else nexToken(d);
            }
          }
        else {
          let items = res.data.usageReports;

          completeCount++;
          if (items) {
            console.info(`\n Data Complete`);
            const output = { intent: completeCount, response: date, complete: true };

            console.info(output);

            arrSave.push({ Warrning: warningCount, values: output});

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
      // json write
      json.write("user", arrSave );

      if (callback) callback();
      else console.log(`\nData Complete: ${completeCount}\nWarnings: ${warningCount}\nDays counted: ${daysCounted}\nDate Init: ${dateInit}\nDate End: ${dateEnd}`);
    }
  };

  nexToken(x);
}
