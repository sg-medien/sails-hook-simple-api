/**
 * Module dependencies
 */
var
  _ = require('lodash');

/**
 * Helpers used by the hook.
 *
 * @type {Object}
 */
var
  helper = {

    /**
     * Try to parse a json string and convert it to a object.
     *
     * @param {String} jsonString The json string.
     *
     * @return {Object|Boolean} The parsed object or `false`.
     */
    tryParseJSON : function (jsonString) {

      if (!_.isString(jsonString)) return false;

      try {

        var o = JSON.parse(jsonString);

        if (o && _.isObject(o) && _.size(o)) {

          return o;
        }
      }
      catch (e) {}

      return false;
    },

    /**
     * Try to parse a time string and convert it to a date object.
     *
     * @param {String} timeString The time string.
     *
     * @return {Object|Boolean} The parsed date object or `false`.
     */
    tryNewDateFromString : function (timeString) {

      if (!_.isString(timeString)) return false;

      try {

        var t = new Date(timeString);

        if (t && _.isObject(t) && _.size(t) && t.toLowerCase()!=='invalid date') {

          return t;
        }
      }
      catch (e) {}

      return false;
    },

    /**
     * Try to parse an unix timestamp and convert it to a date object.
     *
     * @param {String|Integer} timestamp The unix timestamp.
     *
     * @return {Object|Boolean} The parsed date object or `false`.
     */
    tryNewDateFromUnixTimestamp : function (timestamp) {

      try {

        var t = new Date(timestamp * 1000);

        if (t && _.isObject(t) && _.size(t) && t.toLowerCase()!=='invalid date') {

          return t;
        }
      }
      catch (e) {}

      return false;
    },

    /**
     * Quote regular expression characters.
     *
     * @param {String} str The input string.
     * @param {String} delimiter If the optional delimiter is specified, it will also be escaped.
     *
     * @return {String} The quoted (escaped) string.
     */
    pregQuote : function (str, delimiter) {

      return String(str).replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    }
  };

module.exports = helper;
