/**
 * Response dependencies
 */
var
  _ = require('lodash');

module.exports = function jsonx(data){

  // Get access to `req`, `res`
  var
    req = this.req,
    res = this.res;

  function stringifyError(err){

    var plainObject = {};
    Object.getOwnPropertyNames(err).forEach(function (key){

      plainObject[key] = err[key];
    });

    return JSON.stringify(plainObject);
  };

  function handleError(err){

    var
      serializedErr,
      jsonSerializedErr;

    try {

      serializedErr = stringifyError(err);
      jsonSerializedErr = JSON.parse(serializedErr);

      if (!jsonSerializedErr.stack || !jsonSerializedErr.message){

        jsonSerializedErr.message = err.message;
        jsonSerializedErr.stack = err.stack;
      }

      return jsonSerializedErr;
    }
    catch (e){

      return {name: err.name, message: err.message, stack: err.stack};
    }
  }

  if (!_.isUndefined(data) && !_.isObject(data)){

    // note that this guard includes arrays
    return res.send(data);
  }

  // When responding with an Error instance, if it's going to get sringified into
  // a dictionary with no `.stack` or `.message` properties, add them in.
  if (data instanceof Error){

    data = handleError(data);
  }

  return res.customJson(data);
};
