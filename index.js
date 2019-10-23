const fs = require("fs");
const _object = require("lodash/fp/object");
const options = {
  storage: undefined,
  default: undefined
};
let database;
// handles buffering file and enables referencing
const initialise = async opt => {
  // removes the need to specify defaults on every call
  // by persisting any passed settings
  let opts = opt;
  for (key in options) {
    if (!opts[key] && options[key]) {
      opts[key] = options[key];
    } else if (opts[key]) options[key] = opts[key];
    else if (!options[key] && !opts[key])
      throw new Error("Please pass a " + key + " location, at least once.");
  }

  if (!opts.reset && !opts.force) {
    return new Promise((resolve, reject) => {
      if (database) resolve(database);
      else {
        try {
          fs.exists(opts.storage, exists => {
            if (exists) {
              try {
                fs.readFile(opts.storage, (err, data) => {
                  if (err) reject(err);
                  database = JSON.parse(data);
                  resolve(database);
                });
              } catch {
                throw new Error(
                  "Couldn't read the file. Make sure it's JSON parsable."
                );
              }
            } else {
              fs.exists(opts.default, exists => {
                if (exists) {
                  fs.copyFile(opts.default, opts.storage, err => {
                    if (err) reject(err);
                    else {
                      try {
                        fs.readFile(opts.storage, (err, data) => {
                          if (err) reject(err);
                          database = JSON.parse(data);
                          resolve(database);
                        });
                      } catch (err) {
                        throw new Error(err);
                      }
                    }
                  });
                }
              });
            }
          });
        } catch (err) {
          reject(err);
        }
      }
    });
  } else if (!opts.reset && opts.force) {
    return new Promise((resolve, reject) => {
      fs.exists(opts.storage, exists => {
        if (exists) {
          try {
            fs.readFile(opts.storage, (err, data) => {
              if (err) reject(err);
              database = JSON.parse(data);
              resolve(database);
            });
          } catch (err) {
            throw new Error(err);
          }
        }
      });
    });
  } else if (opts.reset) {
    return new Promise((resolve, reject) => {
      fs.copyFile(opts.default, opts.storage, err => {
        if (err) reject(err);
        fs.readFile(opts.storage, (err, data) => {
          if (err) reject(err);
          database = JSON.parse(data);
          resolve(database);
        });
      });
    });
  }
};

// builds the easy syntax passed by a request into a JSON object for merging with main JSON Storage blob
const construct = (selection, value, callback) => {
  let built = {};
  let array = selection.split(".");
  // .split returns length == 1 with 0 matches
  if (array.length == 1) {
    if (typeof value == "object") {
      built = JSON.parse('{"' + selection + '": {}}');
      built[selection] = value;
    } else built = JSON.parse("{" + selection + ":" + value + "}");
  } else {
    try {
      array.forEach((item, index) => {
        let helper = {};
        let passed = item.toString();
        index == array.length - 1
          ? (helper[passed] = value) // assign the last specified object the value passed
          : (helper[passed] = {}); // assign an empty object for parents
        Object.assign(built, helper);
      });
    } catch {
      null;
      // last value of array is undefined,
      // so 'Object' throws an error when trying to assign
    }

    for (i = array.length - 1; i > 0; i--) {
      let helper;
      let key = Object.keys(built)[i];
      let value = built[key];
      typeof value == "object"
        ? (helper = JSON.parse('{"' + key + '":' + JSON.stringify(value) + "}")) // convert key with typeof JSON (assigned a value) to string for parsing back to JSON
        : (helper = JSON.parse('{"' + key + '":' + value + "}")); // prevent ""_string_""
      built[Object.keys(built)[i - 1]] = helper;
      delete built[Object.keys(built)[i]]; // cleanup the bumped item
    }
  }
  callback(built);
};

// Set the key:value pair, or a sub key:value pair if requested
const set = async (selection, value, callback, force) => {
  if (!force) force = true; // force refreshing from file by default
  if (typeof selection == "string" && value) {
    await initialise({ force: force }).then(database => {
      construct(selection, value, data => {
        database = _object.merge(database, data); // <3 to lodash
        fs.writeFile(options.storage, JSON.stringify(database), err => {
          if (typeof callback == "function") {
            if (err) callback(false, err);
            else callback(true);
          } else {
            if (err) reject(err);
            else return true;
          }
        });
      });
    });
  } else
    throw new Error("Call to setter detected, but no parameters were valid");
};

const reset = async (selection, callback) => {
  let value;
  if (
    selection &&
    typeof selection == "string" &&
    typeof callback == "function"
  ) {
    fs.readFile(defaults, (err, data) => {
      if (err) callback(false, err);
      else {
        let original = JSON.parse(data);
        let key = "original." + selection;
        try {
          value = eval(key);
          set(selection, value, callback);
        } catch {
          callback(false, "Couldn't find that setting in defaults.");
        }
      }
    });
  } else if (!selection && !callback) {
    callback(false, "Please pass parameters.");
  } else if (
    selection &&
    typeof selection !== "string" &&
    typeof callback == "function"
  ) {
    callback(
      false,
      "Expected selection to be a string, but got " + typeof selection
    );
  } else return "Your parameters were incorrect in an unexpected way.";
};

const get = async (selection, callback, force) => {
  let data;
  if (!force) force = true; // force refreshing from file by default
  await initialise({ force: force })
    .then(database => {
      if (typeof selection !== "function") {
        let key = "database." + selection;
        try {
          data = eval(key); // return one pair
          return true;
        } catch {
          return true; // data = undefined;
        }
      } else {
        data = database; // return full json object
        return true;
      }
    })
    .catch(err => {
      callback(false, err);
    });
  if (typeof callback == "function") {
    if (data) callback(data);
    else callback(false, "Couldn't find that setting in storage.");
  } else return data;
};

module.exports = {
  initialise,
  get,
  set,
  reset
};
