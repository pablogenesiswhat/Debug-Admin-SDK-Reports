const jsonfile = require('jsonfile');
const dateFormat = require("dateformat");

module.exports = class {
  write (name, values) {
    const date = dateFormat(new Date(), "yyyy-mm-dd");
    const stringify = { date: values };

    jsonfile.writeFile(`logs/${name}.json`, stringify);
  }
};
