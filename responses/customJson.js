/**
 * Response dependencies
 */
var
  apiUtil = require('../lib/apiUtil'),
  _ = require('lodash');

module.exports = function customJson(obj){

  // Get access to `req`, `res`, `sails` & `apiUtil`
  var
    req = this.req,
    res = this.res,
    sails = req._sails,
    config = apiUtil.getConfig();

  // Allow status / body
  if (2 == arguments.length) {

    // res.json(body, status) backwards compat
    if ('number' == typeof arguments[1]) {

      res.statusCode = arguments[1];
      if (typeof obj === 'number') {

        deprecate('res.json(obj, status): Use res.json(status, obj) instead');
      }
      else {

        deprecate('res.json(num, status): Use res.status(status).json(num) instead');
      }
    }
    else {

      res.statusCode = obj;
      obj = arguments[1];
    }
  }

  // Set object to null if it is undefined
  if (_.isUndefined(obj)){

    obj = null;
  }

  // Get settings
  var
    app = sails.hooks.http.app,
    replacer = app.get('json replacer'),
    minify = apiUtil.wantsPrettyJSON(req)!==-1 ? !apiUtil.wantsPrettyJSON(req) : ((config && !_.isUndefined(config.minify) && _.isBoolean(config.minify)) ? config.minify : process.env.NODE_ENV === 'production'),
    spaces = minify ? 0 : 2,
    jsonp = apiUtil.isJsonpSupported(req) && !req.isSocket,
    callback = apiUtil.parseJsonp(req),
    envelope = apiUtil.parseEnvelope(req) || (jsonp && callback && !_.isUndefined(config) && (_.isUndefined(config.jsonpAutoEnvelope) || (!_.isUndefined(config.jsonpAutoEnvelope) && config.jsonpAutoEnvelope===true)));

  // If envelope is enabled but manually disabled use this setting
  if (envelope && !_.isUndefined(req.param(apiUtil.getParameterNameEnvelope()))){

    var
      tmpEnvelope = _.isString(req.param(apiUtil.getParameterNameEnvelope())) ? _.trim(req.param(apiUtil.getParameterNameEnvelope())) : req.param(apiUtil.getParameterNameEnvelope());

    if (tmpEnvelope=='false' || tmpEnvelope=='0'){

      envelope = false;
    }
  }

  // Envelope response?
  if (envelope){

    var
      objTmp = {};

    // Add status code to envelope json
    objTmp['statusCode'] = res.statusCode;

    // Add response data to envelope json
    objTmp[apiUtil.getEnvelopeResponseKey()] = _.clone(obj);

    // Add link and x-total-count headers to envelope json (if set)
    if (_.isObject(res._headers) && res._headers.link && res._headers['x-total-count']){

      objTmp.count = res._headers['x-total-count'];

      var
        linkHeaders = res._headers.link.split(',\n');

      if (linkHeaders.length){

        objTmp.links = {};
        for (var index in linkHeaders) {

          var
            linkHeaderParts = linkHeaders[index].split(';'),
            link = _.trim(_.trim(linkHeaderParts[0]).replace(/^<(.+?)>$/, '$1')),
            rel = !_.isUndefined(linkHeaderParts[1]) ? _.trim(linkHeaderParts[1]) : index;

          // Clean rel
          rel = _.trim(rel.replace(/^rel=(\"|\')?(.+?)(\"|\')?$/i, '$2')).toLowerCase();

          objTmp.links[rel] = link
        }
      }
    }

    obj = objTmp;
    res.statusCode = 200;
  }

  // Create body
  var
    body = JSON.stringify(obj, replacer, spaces);

  // Set charset and content-type
  res.charset = res.charset || 'utf-8';
  res.get('Content-Type') || res.set('Content-Type', 'application/json');

  // Jsonp
  if (jsonp && callback) {

    res.charset = 'utf-8';
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Content-Type', 'text/javascript');

    // Restrict callback charset
    callback = callback.replace(/[^\[\]\w$.]/g, '');

    // Replace chars not allowed in JavaScript that are in JSON
    body = body
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');

    var
      jsspace = minify ? '' : ' ';

    // The /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
    // The typeof check is just to reduce client error noise
    body = '/**/'+jsspace+'typeof '+callback+jsspace+'=='+jsspace+'\'function\''+jsspace+'&&'+jsspace+callback+'('+body+');';
  }

  return res.send(body);
};
