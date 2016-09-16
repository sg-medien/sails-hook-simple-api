/**
 * Module dependencies
 */
var
  _ = require('lodash'),
  util = require('util'),
  mergeDefaults = require('merge-defaults'),
  sortObj = require('sort-object'),
  helper = require('./helper');

/**
 * Private vars
 */
var
  configKey,
  config;

/**
 * Utility api methods used by the hook.
 *
 * @type {Object}
 */
var
  apiUtil = {

    /**
     * Init the api.
     *
     * @param {String} key The config key of the api.
     *
     * @return {Void}
     */
    init : function(key){

      if (!_.isUndefined(key) && _.isString(key) && _.trim(key)!=''){

        configKey = _.trim(key);
        config = sails.config[configKey];
      }
    },

    getConfigKey : function(){

      return configKey;
    },

    getConfig : function(){

      return config;
    },

    /**
     * Get the name of the api.
     *
     * @return {String|Boolean} The name of the api or `false` if no name found.
     */
    getName : function() {

      var
        self = this,
        name = false,
        version = false;

      if (!_.isUndefined(config) && !_.isUndefined(config.name) && _.isString(config.name) && _.trim(config.name)!=''){

        name = _.trim(config.name);

        if (version = self.getVersion()){

          name += ' v'+version;
        }
      }

      return name;
    },

    /**
     * Get the version of the api.
     *
     * @return {String|Boolean} The version of the api or `false` if no version found.
     */
    getVersion : function() {

      var
        self = this,
        version = false;

      if (!_.isUndefined(config.version) && !isNaN(parseFloat(config.version)) && parseFloat(config.version)){

        version = parseFloat(config.version);
      }

      return version;
    },

    getHostname : function(req) {

      var
        self = this,
        hasExplicitHost = sails.config.hooks.http && sails.config.explicitHost,
        hasApiHostname = config && config.hostname,
        hostname = sails.config.proxyHost || hasExplicitHost || hasApiHostname || sails.config.host;

      if (!hostname){

        hostname = req.get('host') ? req.get('host') : hostname;
      }

      if (!hostname || !_.isString(hostname)){

        hostname = 'localhost';
      }

      return _.trim(hostname).toLocaleLowerCase().replace(/^http(s)?:\/\//, '').replace(/:[\d]+$/, '');
    },

    getPort : function(req) {

      var
        self = this,
        port = sails.config.proxyPort || sails.config.port;

      if (!port){

        port = (req.get('host') && req.get('host').match(/^.+?:[\d]+$/)) ? _.trim(req.get('host')).replace(/^.+?:([\d]+)$/, '$1') : port;
      }

      if (!port){

        port = (req.get('host') && req.get('host').match(/^http(s)?:\/\/.+?$/)) ? (req.get('host').replace(/^(http(s)?):\/\/.+?$/, '$1')=='https' ? 443 : 80) : port;
      }

      if (!port){

        port = req.protocol ? (req.protocol=='http' ? 80 : (req.protocol=='https' ? 443 : port)) : port;
      }

      if (!port || isNaN(parseInt(port))){

        port = 1337;
      }

      return parseInt(port);
    },

    getHost : function(req) {

      var
        self = this,
        hostname = self.getHostname(req),
        port = self.getPort(req);

      return hostname+(port!==80 ? ':'+port : '');
    },

    useSSL : function(req) {

      var
        self = this,
        useSSL = sails.config.ssl === true || (sails.config.ssl && ((sails.config.ssl.key && sails.config.ssl.cert) || sails.config.ssl.pfx)),
        probablyUseSSL = (self.getPort(req) === 443);

      return (useSSL || probablyUseSSL) ? true : false;
    },

    getBaseUrl : function(req) {

      var
        self = this,
        useSSL = self.useSSL(req),
        hostname = self.getHostname(req),
        port = self.getPort(req);

      return (useSSL ? 'https' : 'http')+'://'+hostname+((port===80 || port===433) ? '' : ':'+port);
    },

    getCurrentPathname : function(req, decodeParameterValues) {

      var
        self = this,
        pathname = req.originalUrl;

      if (!pathname || !_.isString(pathname)){

        pathname = '';
      }

      if (pathname!=''){

        var
          pathnameArr = pathname.split('?');

        if (pathnameArr.length>1){

          if (decodeParameterValues) {

            pathname = pathnameArr.shift();

            var
              search = _.trim(pathnameArr.join('?')),
              searchArr = search.split('&');

            for (var index in searchArr) {

              var
                searchArrParts = searchArr[index].split('='),
                searchName = searchArrParts[0],
                searchValue = !_.isUndefined(searchArrParts[1]) ? decodeURIComponent(searchArrParts[1]) : false;

              searchArr[index] = searchName + (searchValue !== false ? '=' + searchValue : '');
            }

            search = searchArr.join('&');
            pathname += search != '' ? '?' + search : '';
          }
        }
      }

      return _.trim(pathname);
    },

    getCurrentPath : function(req) {

      var
        self = this,
        pathnameArr = self.getCurrentPathname(req).split('?');

      return pathnameArr[0];
    },

    getCurrentSearch : function(req, decodeParameterValues) {

      var
        self = this,
        pathnameArr = self.getCurrentPathname(req, decodeParameterValues).split('?');

      pathnameArr.shift();

      var
        search = _.trim(pathnameArr.join('?'));

      return search!='' ? '?'+search : '';
    },

    getCurrentUrl : function(req, withoutSearch) {

      var
        self = this;

      return self.getBaseUrl(req)+(withoutSearch ? self.getCurrentPath(req) : self.getCurrentPathname(req));
    },

    getBodyParams : function(req) {

      var
        self = this,
        params = _.cloneDeep(req.body) || {};

      // Make an array out of the request body data if it wasn't one already;
      // this allows us to process multiple entities (e.g. for use with a "create" blueprint) the same way
      // that we process singular entities.
      params = _.isArray(params) ? params : [params];

      return params;
    },

    getFilterParams : function(req) {

      var
        self = this,
        params = {},
        queryParams = _.cloneDeep(req.query) || {};

      mergeDefaults(params, queryParams);

      // Mixin route params, as long as they have defined values
      _.each(Object.keys(req.params), function(paramName) {

        if (params[paramName] || !_.isUndefined(req.params[paramName])) {

          params[paramName] = params[paramName] || req.params[paramName];
        }
      });

      return params;
    },

    /**
     * Get the model class by the model name.
     *
     * @param {String} name The model name.
     *
     * @return {Collection} The model class.
     */
    modelGetByName : function(name) {

      var
        self = this;

      var
        Model = sails.models[name.toLowerCase()];

      if (!Model) throw new Error(util.format('Invalid parameter, "name".\nI don\'t know about any models named: `%s`', name.toLowerCase()));

      return Model;
    },

    /**
     * Get the model class by the request object.
     *
     * @param {Object} req The request object.
     *
     * @return {Collection} The model class.
     */
    modelGetByRequest : function(req) {

      var
        self = this;

      // Ensure a model can be deduced from the request options
      var
        model = !_.isUndefined(req.options) ? (req.options.model || req.options.controller) : false;

      if (!model) throw new Error(util.format('No "model" specified in route options.'));

      var
        Model = req._sails.models[model];

      if (!Model) throw new Error(util.format('Invalid route option, "model".\nI don\'t know about any models named: `%s`', model));

      return Model;
    },

    modelPopulateQuery : function(query, associations) {

      var
        self = this;

      return _.reduce(associations, function(query, association){

        var
          limit = !_.isUndefined(association.limit) ? { limit : association.limit } : {};

        return query.populate(association.alias, limit);
      }, query);
    },

    /**
     * Compare the input with a given model instance.
     *
     * @param {Object} input The input object.
     * @param {Object} instance The model instance object.
     *
     * @return {Boolean} The result of the result of comparison (`true` or `false`).
     */
    modelCompareInput : function(input, instance){

      var
        self = this;

      if (!_.isObject(input)) throw new Error(util.format('Invalid parameter, "input". The parameter must be of type object.'));
      if (!_.isObject(instance) || !_.isFunction(instance.toObject)) throw new Error(util.format('Invalid parameter, "instance". The parameter must be a valid model instance.'));

      // Remove input keys which are not available in the model instance object
      var newInput = {};
      for (var name in input) {

        if (!_.isUndefined(instance[name])){

          newInput[name] = input[name];
        }
      }

      var
        inputString = JSON.stringify(sortObj(mergeDefaults(newInput || {}, instance.toObject())), function replacer (key, value){

          if (typeof value != 'string' && typeof value != 'object'){

            value = value.toString();
          }

          return value;
        }),
        instanceString = JSON.stringify(sortObj(mergeDefaults({}, instance.toObject())), function replacer (key, value){

          if (typeof value != 'string' && typeof value != 'object'){

            value = value.toString();
          }

          return value;
        });

      return inputString===instanceString;
    },

    /**
     * Get the name of the method override parameter to replace the original http method.
     *
     * @return {String} The name of the method override parameter.
     */
    getParameterNameMethodOverride: function(){

      var
        self = this,
        parameterNameMethodOverride = '_method';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNameMethodOverride) && _.isString(config.parameterNameMethodOverride) && _.trim(config.parameterNameMethodOverride)!=''){

        parameterNameMethodOverride = _.trim(config.parameterNameMethodOverride);
      }

      return parameterNameMethodOverride;
    },

    /**
     * Get the name of the method override header to replace the original http method.
     *
     * @return {String} The name of the method override header.
     */
    getHeaderNameMethodOverride: function(){

      var
        self = this,
        headerNameMethodOverride = 'X-Http-Method-Override';

      if (!_.isUndefined(config) && !_.isUndefined(config.headerNameMethodOverride) && _.isString(config.headerNameMethodOverride) && _.trim(config.headerNameMethodOverride)!=''){

        headerNameMethodOverride = _.trim(config.headerNameMethodOverride);
      }

      return headerNameMethodOverride;
    },

    /**
     * Get the name of the pretty parameter to receive a custom minify setting.
     *
     * @return {String} The name of the pretty parameter.
     */
    getParameterNamePretty: function(){

      var
        self = this,
        parameterNamePretty = 'pretty';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNamePretty) && _.isString(config.parameterNamePretty) && _.trim(config.parameterNamePretty)!=''){

        parameterNamePretty = _.trim(config.parameterNamePretty);
      }

      return parameterNamePretty;
    },

    /**
     * Checks if we have to send pretty or minified json in the response.
     *
     * @param {Object} req The request object.
     *
     * @return {Boolean|Integer} `true` or `false` or `-1' if the pretty setting is disabeld or the parameter is not specified.
     */
    wantsPrettyJSON: function(req){

      var
        self = this,
        pretty = -1;

      // Get pretty setting
      if (!_.isUndefined(config) && !_.isUndefined(config.pretty) && config.pretty===true && !_.isUndefined(req.param(self.getParameterNamePretty()))){

        var
          tmpPretty = _.isString(req.param(self.getParameterNamePretty())) ? _.trim(req.param(self.getParameterNamePretty())) : req.param(self.getParameterNamePretty());

        pretty = true;
        if (tmpPretty=='0' || tmpPretty=='false'){

          pretty = false;
        }
      }

      return pretty;
    },

    parsePrettyToString: function(req) {

      var
        self = this,
        parameterNamePretty = self.getParameterNamePretty(),
        wantsPrettyJSON = self.wantsPrettyJSON(req);

      return wantsPrettyJSON!==-1 ? parameterNamePretty+(!wantsPrettyJSON ? '=0' : '') : '';
    },

    /**
     * Get the name of the envelope parameter to receive a favorite envelope setting by an user.
     *
     * @return {String} The name of the envelope parameter.
     */
    getParameterNameEnvelope: function(){

      var
        self = this,
        parameterNameEnvelope = 'envelope';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNameEnvelope) && _.isString(config.parameterNameEnvelope) && _.trim(config.parameterNameEnvelope)!=''){

        parameterNameEnvelope = _.trim(config.parameterNameEnvelope);
      }

      return parameterNameEnvelope;
    },

    /**
     * Parse the envelope setting by the request object.
     *
     * @param {Object} req The request object.
     *
     * @return {Boolean} The parsed envelope setting.
     */
    parseEnvelope: function(req){

      var
        self = this,
        envelope = false;

      // Get envelope setting
      if (!_.isUndefined(req.param(self.getParameterNameEnvelope()))){

        var
          tmpEnvelope = _.isString(req.param(self.getParameterNameEnvelope())) ? _.trim(req.param(self.getParameterNameEnvelope())) : req.param(self.getParameterNameEnvelope());

        envelope = true;
        if (tmpEnvelope=='false' || tmpEnvelope=='0'){

          envelope = false;
        }
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.defaultEnvelope) && _.isBoolean(config.defaultEnvelope)){

        envelope = config.defaultEnvelope;
      }

      return envelope;
    },

    parseEnvelopeToString: function(req) {

      var
        self = this,
        parameterNameEnvelope = self.getParameterNameEnvelope(),
        envelope = self.parseEnvelope(req);

      return !_.isUndefined(req.param(parameterNameEnvelope)) ? parameterNameEnvelope+(!envelope ? '=0' : '') : '';
    },

    /**
     * Get the name of the key which is used to envelope the return of the response data.
     *
     * @return {String} The name of the key.
     */
    getEnvelopeResponseKey: function(){

      var
        self = this,
        envelopeResponseKey = 'response';

      if (!_.isUndefined(config) && !_.isUndefined(config.envelopeResponseKey) && _.isString(config.envelopeResponseKey) && _.trim(config.envelopeResponseKey)!=''){

        envelopeResponseKey = _.trim(config.envelopeResponseKey);
      }

      return envelopeResponseKey;
    },

    /**
     * Checks if jsonp is supported by the api.
     *
     * @param {Object} req The request object.
     *
     * @return {Boolean} `true` or `false`.
     */
    isJsonpSupported: function(req){

      var
        self = this,
        jsonpSupport = false;

      if (!_.isUndefined(config) && !_.isUndefined(config.jsonp) && _.isBoolean(config.jsonp)){

        jsonpSupport = config.jsonp;
      }
      else if (!_.isUndefined(req.options.jsonp) && _.isBoolean(req.options.jsonp)){

        jsonpSupport = req.options.jsonp;
      }

      return jsonpSupport;
    },

    /**
     * Get the name of the jsonp parameter to receive a favorite jsonp callback function name by an user.
     *
     * @return {String} The name of the jsonp parameter.
     */
    getParameterNameJsonp: function(){

      var
        self = this,
        parameterNameJsonp = 'callback';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNameJsonp) && _.isString(config.parameterNameJsonp) && _.trim(config.parameterNameJsonp)!=''){

        parameterNameJsonp = _.trim(config.parameterNameJsonp);
      }

      return parameterNameJsonp;
    },

    /**
     * Parse the jsonp callback function name by the request object.
     *
     * @param {Object} req The request object.
     *
     * @return {String|Boolean} The parsed jsonp callback function name or `false`.
     */
    parseJsonp: function(req){

      var
        self = this,
        jsonp = false;

      // Get jsonp callback function name
      if (!_.isUndefined(req.param(self.getParameterNameJsonp())) && _.isString(req.param(self.getParameterNameJsonp())) && _.trim(req.param(self.getParameterNameJsonp()))!=''){

        jsonp = _.trim(req.param(self.getParameterNameJsonp()));
      }

      return jsonp;
    },

    parseJsonpToString: function(req) {

      var
        self = this,
        parameterNameJsonp = self.getParameterNameJsonp(),
        jsonp = self.parseJsonp(req);

      return (jsonp!==false && self.isJsonpSupported(req)) ? parameterNameJsonp+'='+jsonp : '';
    },

    /**
     * Get the attribute name of the primary key in a model by the request object or by the model name.
     *
     * @param {Object|String} reqOrName The request object or the model name.
     *
     * @return {String|Boolean} The attribute name of the primary key or `false`.
     */
    getNameOfPk: function(reqOrName){

      var
        self = this,
        pkName = false;

      // Get the model by the request object or by the name
      var Model = !_.isString(reqOrName) ? self.modelGetByRequest(reqOrName) : self.modelGetByName(reqOrName);

      if (!Model || _.isUndefined(Model.primaryKey) || !_.isString(Model.primaryKey)) return pkName;

      pkName = Model.primaryKey;

      return pkName;
    },

    /**
     * Parse the primary key value by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {String|Undefined} The primary key value or `undefined`.
     */
    parsePk: function(req, name){

      var
        self = this,
        pkName = self.getNameOfPk((!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? name : req),
        pk = !_.isUndefined(req.options) ? (req.options.id || req.param('id') || req.param(pkName)) : undefined;

      // Exclude criteria on id field
      pk = !_.isUndefined(pk) ? pk.toString() : pk;
      pk = (_.isString(pk) && _.trim(pk)!='') ? _.trim(pk) : undefined;

      return pk;
    },

    /**
     * Equivalent to `parsePk`, but throw an error if the primary key cannot be retrieved.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {String} The primary key value.
     */
    parseRequiredPk: function(req, name){

      var
        self = this,
        pk = self.parsePk(req, name);

      // Validate the required `id` parameter
      if (!pk){

        var err = new Error(
          'No `id` parameter provided.'+
          '(Note: even if the model\'s primary key is not named `id`- '+
          '`id` should be used as the name of the parameter- it will be '+
          'mapped to the proper primary key name)'
        );
        err.status = 400;
        throw err;
      }

      return pk;
    },

    /**
     * Parse all `values` by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Object} The parsed values.
     */
    parseValues: function(req, name) {

      var
        self = this,
        defaultBlacklist = ['id'];

      // Allow customizable blacklist for params NOT to include as values
      req.options.values = req.options.values || {};
      req.options.values.blacklist = req.options.values.blacklist || defaultBlacklist;

      // Validate blacklist to provide a more helpful error msg
      var blacklist = req.options.values.blacklist;

      if (blacklist && !_.isArray(blacklist)) {

        throw new Error('Invalid `req.options.values.blacklist`. Should be an array of strings (parameter names.)');
      }

      // Add the attribute name of the primary key to the blacklist
      if (self.getNameOfPk((!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? name : req)){

        blacklist.push(self.getNameOfPk((!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? name : req));
      }

      // Add the pretty parameter to the blacklist if the parameter is set and supported
      if (self.wantsPrettyJSON(req)!==-1){

        blacklist.push(self.getParameterNamePretty());
      }

      // Add the envelope parameter to the blacklist
      blacklist.push(self.getParameterNameEnvelope());

      // Add the jsonp parameter to the blacklist if the parameter is set and supported
      if (self.isJsonpSupported(req)){

        blacklist.push(self.getParameterNameJsonp());
      }

      // Add the page, limit, populate, populate limit, sort and fields parameter to the blacklist
      blacklist.push(self.getParameterNamePage());
      blacklist.push(self.getParameterNameLimit());
      blacklist.push(self.getParameterNamePopulate());
      blacklist.push(self.getParameterNamePopulateLimit());
      blacklist.push(self.getParameterNameSort());
      blacklist.push(self.getParameterNameFields());

      // Start an array to hold values
      var values;

      // Get all body params
      var bodyParams = self.getBodyParams(req);

      // Process each item in the bodyParams array, merging with req.options, omitting blacklisted properties, etc.
      var valuesArray = _.map(bodyParams, function(element){

        var values;

        // Merge properties of the element into req.options.value, omitting the blacklist
        values = mergeDefaults(element, _.omit(req.options.values, 'blacklist'));

        // Omit properties that are in the blacklist (like query modifiers)
        values = _.omit(values, blacklist || defaultBlacklist);

        // Remove any properties with undefined values and trim values if type is string
        var newValues = {};
        for (var name in values) {

          if (!_.isUndefined(values[name])) {

            newValues[name] = _.isString(values[name]) ? _.trim(values[name]) : values[name];
          }
        }

        return newValues;
      });

      // If the bodyParams array has more than one element
      if (bodyParams.length>1) {

        values = valuesArray;
      }
      // Otherwise grab the first (and only) value from valuesArray
      else {

        values = valuesArray[0];
      }

      return values;
    },

    /**
     * Parse all `criteria` by the request object and optional depending on a different model.
     *
     * Structure of a value:
     * `criteria``value` e.g. `2`, `=2`, `!2`, `=>Max`
     *
     * Structure in an url:
     * `field`=`criteria``value` e.g. http(s)://...?`id=2`, http(s)://...?`id==2`, http(s)://...?`id=!2`, http(s)://...?`name==>Max`
     *
     * Available criteria modifiers:
     * Equal:                 ``, `=`, `==`         (Note: You can pass multiple values separated by a comma e.g. `=1,2,3` means '1' or '2' or '3')
     * Not equal:             `!`, `!=`             (Note: You can pass multiple values separated by a comma e.g. `!1,2,3` means not '1' and '2' and '3')
     * Less than:             `<`
     * Less than or equal:    `<=`
     * Greater than:          `>`
     * Greater than or equal: `>=`
     * Starts with:           `=>`
     * Ends with:             `=<`
     * Contains:              `@`, `=@`
     * Like:                  `%`, `=%`, `*`, `=*`  (Note: You can use `%` or `*` anywhere in the search phrase to mark them as unknown part of the search phrase)
     * Between:               `><`                  (Note: You can separate the between start and end value with a comma e.g. `><1,9`)
     *
     * If you would like to search without a modifier for a phrase which begins with a modifier you can escape your search phrase with a `\` at the beginning e.g.:
     *
     * Without escaping:
     * `@domain.com` finds `email@domain.com`, `domain.com` and 'domain.com/path'
     *
     * With escaping:
     * `\@domain.com` finds nothing because the values `email@domain.com`, `domain.com` and 'domain.com/path' are not exactly `@domain.com`
     *
     * If you want like to search for a real `%` or `*` during you set the like modifier, just escape it with a `\`.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Object} The parsed criteria.
     */
    parseCriteria: function(req, name){

      var
        self = this,
        defaultBlacklist = ['id'],
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req),
        modifierRegExp = '(=(=|<|>|%|\\*|@)?|\!(=)?|@|%|\\*|<(=)?|>(=|<)?)',
        modifierTranslations = {

          '=' : false,
          '==' : false,
          '!' : 'not',
          '!=' : 'not',
          '@' : 'contains',
          '=@' : 'contains',
          '%' : 'like',
          '=%' : 'like',
          '*' : 'like',
          '=*' : 'like',
          '=<' : 'endsWith',
          '=>' : 'startsWith',
          '><' : ['>=', '<=']
        };

      // Allow customizable blacklist for params NOT to include as criteria.
      req.options.criteria = req.options.criteria || {};
      req.options.criteria.blacklist = req.options.criteria.blacklist || defaultBlacklist;

      // Validate blacklist to provide a more helpful error msg.
      var blacklist = req.options.criteria && req.options.criteria.blacklist;
      if (blacklist && !_.isArray(blacklist)){

        throw new Error('Invalid `req.options.criteria.blacklist`. Should be an array of strings (parameter names.)');
      }

      // Add the attribute name of the primary key to the blacklist
      if (self.getNameOfPk(Model.identity)){

        blacklist.push(self.getNameOfPk(Model.identity));
      }

      // Add the pretty parameter to the blacklist if the parameter is set and supported
      if (self.wantsPrettyJSON(req)!==-1){

        blacklist.push(self.getParameterNamePretty());
      }

      // Add the envelope parameter to the blacklist
      blacklist.push(self.getParameterNameEnvelope());

      // Add the jsonp parameter to the blacklist if the parameter is set and supported
      if (self.isJsonpSupported(req)){

        blacklist.push(self.getParameterNameJsonp());
      }

      // Add the page, limit, populate, populate limit, sort and fields parameter to the blacklist
      blacklist.push(self.getParameterNamePage());
      blacklist.push(self.getParameterNameLimit());
      blacklist.push(self.getParameterNamePopulate());
      blacklist.push(self.getParameterNamePopulateLimit());
      blacklist.push(self.getParameterNameSort());
      blacklist.push(self.getParameterNameFields());

      // Get all filter params
      var where = self.getFilterParams(req);

      // Omit built-in runtime config (like query modifiers)
      where = _.omit(where, blacklist || defaultBlacklist);

      // Try to get the primary key criteria
      var
        primaryKeyCriteria = {};

      if (self.getNameOfPk(Model.identity) && self.parsePk(req, Model.identity)){

        primaryKeyCriteria[self.getNameOfPk(Model.identity)] = self.parsePk(req, Model.identity);
      }

      // Merge `req.options.where`, `primaryKeyCriteria` and `where` and return
      where = _.merge({}, req.options.where || {}, primaryKeyCriteria, where) || undefined;

      // Remove criteria which are not available in the model attributes
      var newWhere = {};
      for (var name in where) {

        if (_.isString(name) && _.trim(name)!='' && !_.isUndefined(Model.attributes) && !_.isUndefined(Model.attributes[name]) && !_.isFunction(Model.attributes[name]) && _.isObject(Model.attributes[name]) && _.isUndefined(Model.attributes[name].collection)){

          newWhere[_.trim(name)] = where[_.trim(name)];
        }
      }
      where = newWhere;

      // Parse criteria for modifiers
      var newWhere = { };
      for (var name in where) {

        var
          match = false,
          modifier = false,
          whereValue = _.trim(where[name]);

        if (match = whereValue.match(new RegExp('^'+modifierRegExp))){

          modifier = match[0];
          modifier = !_.isUndefined(modifierTranslations[modifier]) ? modifierTranslations[modifier] : modifier;
          whereValue = _.trim(whereValue.replace(new RegExp('^'+modifierRegExp), ''));

          // Replace * to % if chars not escaped and modfier is `like`
          if (modifier=='like' && whereValue!=''){

            whereValue = whereValue.replace(/([^\\]+|^)\*/g, '$1%');
          }
        }
        else if (whereValue.match(new RegExp('^\\\\\\s*'+modifierRegExp))){

          whereValue = _.trim(whereValue.replace(new RegExp('^\\\\\\s*'), ''));
        }

        if ((modifier===false || (_.isString(modifier) && modifier=='not') || _.isArray(modifier)) && whereValue.match(/,/)){

          var
            whereValueArray = whereValue.split(',');

          for (var index in whereValueArray) {

            whereValueArray[index] = _.trim(whereValueArray[index]);

            if (whereValueArray[index].toLocaleLowerCase()=='false'){

              whereValueArray[index] = 0;
            }
            else if (whereValueArray[index].toLocaleLowerCase()=='true'){

              whereValueArray[index] = 1;
            }
            else if (whereValueArray[index].toLocaleLowerCase()=='null' || whereValueArray[index].toLocaleLowerCase()=='undefined' || whereValueArray[index]==''){

              whereValueArray[index] = null;
            }
            else if (!_.isUndefined(Model.attributes) && !_.isUndefined(Model.attributes[name]) && !_.isUndefined(Model.attributes[name].type) && _.isString(Model.attributes[name].type) && (Model.attributes[name].type.toLocaleLowerCase()=='date' || Model.attributes[name].type.toLocaleLowerCase()=='datetime'))
            {
              var
                date = helper.tryNewDateFromUnixTimestamp(whereValueArray[index]) || helper.tryNewDateFromString(whereValueArray[index]);

              if (date) {

                whereValueArray[index] = date;
              }
            }
          }
          whereValue = _.uniq(whereValueArray);
        }
        else {

          if (whereValue.toLocaleLowerCase()=='false'){

            whereValue = 0;
          }
          else if (whereValue.toLocaleLowerCase()=='true'){

            whereValue = 1;
          }
          else if (whereValue.toLocaleLowerCase()=='null' || whereValue.toLocaleLowerCase()=='undefined' || whereValue==''){

            whereValue = modifier=='like' ? '%' : null;
          }
          else if (!_.isUndefined(Model.attributes) && !_.isUndefined(Model.attributes[name]) && !_.isUndefined(Model.attributes[name].type) && _.isString(Model.attributes[name].type) && (Model.attributes[name].type.toLocaleLowerCase()=='date' || Model.attributes[name].type.toLocaleLowerCase()=='datetime'))
          {
            var
              date = HelperService.tryNewDateFromUnixTimestamp(whereValue) || HelperService.tryNewDateFromString(whereValue);

            if (date) {

              whereValue = date;
            }
          }
        }

        if (!modifier){

          newWhere[name] = whereValue;
        }
        else if (_.isArray(modifier)){

          newWhere[name] = {};
          for (var index in modifier) {

            var
              modWhereValue = _.isString(whereValue) ? whereValue : (!_.isUndefined(whereValue[index]) ? whereValue[index] : false);

            if (modWhereValue!==false){

              newWhere[name][modifier[index]] = modWhereValue;
            }
          }
        }
        else if (_.isString(modifier)){

          newWhere[name] = {};
          newWhere[name][modifier] = whereValue;
        }
      }
      where = newWhere;

      // Remove any properties with undefined values and trim values if type is string
      var newWhere = {};
      for (var name in where) {

        if (!_.isUndefined(where[name])) {

          newWhere[name] = _.isString(where[name]) ? _.trim(where[name]) : where[name];
        }
      }
      where = newWhere;

      return where;
    },

    parseCriteriaToString: function(req, name, decodeParameterValues){

      var
        self = this,
        where = self.parseCriteria(req, name),
        whereArr = [],
        modifierTranslations = {

          'not' : '!',
          'contains' : '@',
          'like' : '%',
          'endsWith' : '=<',
          'startsWith' : '=>'
        };

      for (var name in where) {

        var
          whereString = '';

        if (_.isString(where[name]) || _.isNumber(where[name])){

          whereString += where[name];
        }
        else if (_.isArray(where[name])){

          whereString += where[name].join(',');
        }
        else if (_.isObject(where[name])){

          if (_.size(where[name])===1) {

            var
              modifier = Object.keys(where[name])[0],
              value = where[name][modifier];

            modifier = !_.isUndefined(modifierTranslations[modifier]) ? modifierTranslations[modifier] : modifier;
            value = !_.isNull(value) ? (_.isArray(value) ? value.join(',') : value) : '';
            whereString += modifier+value;
          }
          else if (_.size(where[name])===2) {

            var
              modifier = false,
              value = false,
              modifier1 = Object.keys(where[name])[0],
              modifier2 = Object.keys(where[name])[1],
              value1 = where[name][modifier1],
              value2 = where[name][modifier2];

            if (modifier1=='>=' && modifier2=='<='){

              modifier = '><';
              value = (!_.isNull(value1) ? value1 : '')+','+(!_.isNull(value2) ? value2 : '');
            }

            if (modifier!==false && value!==false){

              whereString += modifier+value;
            }
          }
        }

        whereString = _.trim(whereString);
        if (whereString!='' && !decodeParameterValues){

          whereString = encodeURIComponent(whereString);
        }

        if (whereString!=''){

          whereString = name+'='+whereString;
        }
        else {

          whereString = name;
        }

        whereArr.push(whereString);
      }

      return whereArr.join('&');
    },

    /**
     * Get the name of the page parameter to receive a favorite page by an user.
     *
     * @return {String} The name of the page parameter.
     */
    getParameterNamePage: function(){

      var
        self = this,
        parameterNamePage = 'page';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNamePage) && _.isString(config.parameterNamePage) && _.trim(config.parameterNamePage)!=''){

        parameterNamePage = _.trim(config.parameterNamePage);
      }

      return parameterNamePage;
    },

    /**
     * Parse the page by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Integer} The parsed page.
     */
    parsePage: function(req, name){

      var
        self = this,
        page = 1,
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      // Get page
      if (req.param(self.getParameterNamePage()) && !isNaN(parseInt(req.param(self.getParameterNamePage()))) && parseInt(req.param(self.getParameterNamePage()))>=1){

        page = parseInt(req.param(self.getParameterNamePage()));
      }
      else if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].defaultPage) && !isNaN(parseInt(Model[configKey].defaultPage)) && parseInt(Model[configKey].defaultPage)>=1){

        page = parseInt(Model[configKey].defaultPage);
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.defaultPage) && !isNaN(parseInt(config.defaultPage)) && parseInt(config.defaultPage)>=1){

        page = parseInt(config.defaultPage);
      }
      else if (!_.isUndefined(req.options.page) && !isNaN(parseInt(req.options.page)) && parseInt(req.options.page)>=1){

        page = parseInt(req.options.page);
      }

      return page;
    },

    parsePageToString: function(req, name) {

      var
        self = this,
        parameterNamePage = self.getParameterNamePage(),
        page = self.parsePage(req, name);

      return !_.isUndefined(req.param(parameterNamePage)) ? parameterNamePage+'='+page : '';
    },

    /**
     * Get the name of the limit parameter to receive the favorite limit per page by an user.
     *
     * @return {String} The name of the limit parameter.
     */
    getParameterNameLimit: function(){

      var
        self = this,
        parameterNameLimit = 'limit';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNameLimit) && _.isString(config.parameterNameLimit) && _.trim(config.parameterNameLimit)!=''){

        parameterNameLimit = _.trim(config.parameterNameLimit);
      }

      return parameterNameLimit;
    },

    /**
     * Get the maximum limit by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Integer} The maximum limit.
     */
    getMaximumLimit: function(req, name){

      var
        self = this,
        maximumLimit = 100,
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      // Get the maximum limit
      if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].maximumLimit) && (Model[configKey].maximumLimit===false || (!isNaN(parseInt(Model[configKey].maximumLimit)) && parseInt(Model[configKey].maximumLimit)>=1))){

        maximumLimit = Model[configKey].maximumLimit!==false ? parseInt(Model[configKey].maximumLimit) : false;
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.maximumLimit) && (config.maximumLimit===false || (!isNaN(parseInt(config.maximumLimit)) && parseInt(config.maximumLimit)>=1))){

        maximumLimit = config.maximumLimit!==false ? parseInt(config.maximumLimit) : false;
      }

      return maximumLimit;
    },

    /**
     * Parse the limit by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Integer} The parsed limit.
     */
    parseLimit: function(req, name){

      var
        self = this,
        limit = 30,
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      // Get the limit
      if (req.param(self.getParameterNameLimit()) && !isNaN(parseInt(req.param(self.getParameterNameLimit()))) && parseInt(req.param(self.getParameterNameLimit()))>=1){

        limit = parseInt(req.param(self.getParameterNameLimit()));
      }
      else if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].defaultLimit) && !isNaN(parseInt(Model[configKey].defaultLimit)) && parseInt(Model[configKey].defaultLimit)>=1){

        limit = parseInt(Model[configKey].defaultLimit);
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.defaultLimit) && !isNaN(parseInt(config.defaultLimit)) && parseInt(config.defaultLimit)>=1){

        limit = parseInt(config.defaultLimit);
      }
      else if (!_.isUndefined(sails.config.blueprints) && !_.isUndefined(sails.config.blueprints.defaultLimit) && !isNaN(parseInt(sails.config.blueprints.defaultLimit)) && parseInt(sails.config.blueprints.defaultLimit)>=1){

        limit = parseInt(sails.config.blueprints.defaultLimit);
      }
      else if (!_.isUndefined(req.options.limit) && !isNaN(parseInt(req.options.limit)) && parseInt(req.options.limit)>=1){

        limit = parseInt(req.options.limit);
      }

      // Get the maximum limit
      var
        maximumLimit = self.getMaximumLimit(req, name);

      // Reduce the limit if it exceeds the maximum limit
      if (maximumLimit && limit>maximumLimit){

        limit = maximumLimit;
      }

      return limit;
    },

    parseLimitToString: function(req, name) {

      var
        self = this,
        parameterNameLimit = self.getParameterNameLimit(),
        limit = self.parseLimit(req, name);

      return !_.isUndefined(req.param(parameterNameLimit)) ? parameterNameLimit+'='+limit : '';
    },

    /**
     * Get the name of the populate parameter to receive a favorite populate setting by an user.
     *
     * @return {String} The name of the populate parameter.
     */
    getParameterNamePopulate: function(){

      var
        self = this,
        parameterNamePopulate = 'populate';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNamePopulate) && _.isString(config.parameterNamePopulate) && _.trim(config.parameterNamePopulate)!=''){

        parameterNamePopulate = _.trim(config.parameterNamePopulate);
      }

      return parameterNamePopulate;
    },

    /**
     * Parse the populate setting by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Boolean} The parsed populate setting.
     */
    parsePopulate: function(req, name){

      var
        self = this,
        populate = false,
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      // Get populate setting
      if (!_.isUndefined(req.param(self.getParameterNamePopulate()))){

        var
          tmpPopulate = _.isString(req.param(self.getParameterNamePopulate())) ? _.trim(req.param(self.getParameterNamePopulate())) : req.param(self.getParameterNamePopulate());

        populate = true;

        if (_.isString(tmpPopulate)){

          if (tmpPopulate=='false' || tmpPopulate=='0'){

            populate = false;
          }
          else if (tmpPopulate=='true' || tmpPopulate=='1'){

            populate = true;
          }
          else if (tmpPopulate!=''){

            populate = tmpPopulate.replace(/\[|\]/g, '').split(',');
          }
        }
        else if (_.isArray(tmpPopulate)){

          populate = tmpPopulate;
        }
      }
      else if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].defaultPopulate) && (_.isString(Model[configKey].defaultPopulate) || _.isBoolean(Model[configKey].defaultPopulate) || _.isArray(Model[configKey].defaultPopulate))){

        populate = _.isString(Model[configKey].defaultPopulate) ? Model[configKey].defaultPopulate.split(',') : Model[configKey].defaultPopulate;
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.defaultPopulate) && (_.isString(config.defaultPopulate) || _.isBoolean(config.defaultPopulate) || _.isArray(config.defaultPopulate))){

        populate = _.isString(config.defaultPopulate) ? config.defaultPopulate.split(',') : config.defaultPopulate;
      }

      return _.isArray(populate) ? _.uniq(populate.filter(function(el){ return _.trim(el)!==''; })) : populate;
    },

    parsePopulateToString: function(req) {

      var
        self = this,
        parameterNamePopulate = self.getParameterNamePopulate(),
        populate = self.parsePopulate(req);

      return !_.isUndefined(req.param(parameterNamePopulate)) ? parameterNamePopulate+(populate!==true ? '='+(!populate ? '0' : populate.join(',')) : '') : '';
    },

    /**
     * Get the name of the populate limit parameter to receive the favorite populate limit by an user.
     *
     * @return {String} The name of the populate limit parameter.
     */
    getParameterNamePopulateLimit: function(){

      var
        self = this,
        parameterNamePopulateLimit = 'populateLimit';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNamePopulateLimit) && _.isString(config.parameterNamePopulateLimit) && _.trim(config.parameterNamePopulateLimit)!=''){

        parameterNamePopulateLimit = _.trim(config.parameterNamePopulateLimit);
      }

      return parameterNamePopulateLimit;
    },

    /**
     * Get the maximum populate limit by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Integer} The maximum populate limit.
     */
    getMaximumPopulateLimit: function(req, name){

      var
        self = this,
        maximumPopulateLimit = self.getMaximumLimit(req, name),
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      // Get the maximum populate limit
      if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].maximumPopulateLimit) && (Model[configKey].maximumPopulateLimit===false || (!isNaN(parseInt(Model[configKey].maximumPopulateLimit)) && parseInt(Model[configKey].maximumPopulateLimit)>=1))){

        maximumPopulateLimit = Model[configKey].maximumPopulateLimit!==false ? parseInt(Model[configKey].maximumPopulateLimit) : false;
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.maximumPopulateLimit) && (config.maximumPopulateLimit===false || (!isNaN(parseInt(config.maximumPopulateLimit)) && parseInt(config.maximumPopulateLimit)>=1))){

        maximumPopulateLimit = config.maximumPopulateLimit!==false ? parseInt(config.maximumPopulateLimit) : false;
      }

      return maximumPopulateLimit;
    },

    /**
     * Parse the populate limit by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Integer} The parsed populate limit.
     */
    parsePopulateLimit: function(req, name){

      var
        self = this,
        populateLimit = self.parseLimit(req, name),
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      // Get the populate limit
      if (req.param(self.getParameterNamePopulateLimit()) && !isNaN(parseInt(req.param(self.getParameterNamePopulateLimit()))) && parseInt(req.param(self.getParameterNamePopulateLimit()))>=1){

        populateLimit = parseInt(req.param(self.getParameterNamePopulateLimit()));
      }
      else if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].defaultPopulateLimit) && !isNaN(parseInt(Model[configKey].defaultPopulateLimit)) && parseInt(Model[configKey].defaultPopulateLimit)>=1){

        populateLimit = parseInt(Model[configKey].defaultPopulateLimit);
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.defaultPopulateLimit) && !isNaN(parseInt(config.defaultPopulateLimit)) && parseInt(config.defaultPopulateLimit)>=1){

        populateLimit = parseInt(config.defaultPopulateLimit);
      }

      // Get the maximum populate limit
      var
        maximumPopulateLimit = self.getMaximumPopulateLimit(req, name);

      // Reduce the populate limit if it exceeds the maximum populate limit
      if (maximumPopulateLimit && populateLimit>maximumPopulateLimit){

        populateLimit = maximumPopulateLimit;
      }

      return populateLimit;
    },

    parsePopulateLimitToString: function(req, name) {

      var
        self = this,
        parameterNamePopulateLimit = self.getParameterNamePopulateLimit(),
        populateLimit = self.parsePopulateLimit(req, name);

      return !_.isUndefined(req.param(parameterNamePopulateLimit)) ? parameterNamePopulateLimit+'='+populateLimit : '';
    },

    populate : function(query, req, name) {

      var
        self = this,
        shouldPopulate = self.parsePopulate(req),
        associations = [],
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      _.each(Model.associations, function(association){

        if (shouldPopulate!==false){

          var
            populateQuery = true,
            populateLimit = self.parsePopulateLimit(req);

          if (_.isArray(shouldPopulate)){

            populateQuery = _.includes(shouldPopulate, association.alias);
          }

          if (populateQuery){

            associations.push({

              alias: association.alias,
              limit: populateLimit
            });
          }
        }
      });

      return self.modelPopulateQuery(query, associations);
    },

    /**
     * Get the name of the sort parameter to receive the favorite sorting by an user.
     *
     * @return {String} The name of the sort parameter.
     */
    getParameterNameSort: function(){

      var
        self = this,
        parameterNameSort = 'sort';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNameSort) && _.isString(config.parameterNameSort) && _.trim(config.parameterNameSort)!=''){

        parameterNameSort = _.trim(config.parameterNameSort);
      }

      return parameterNameSort;
    },

    /**
     * Parse the sort by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Object} The parsed sort.
     */
    parseSort: function(req, name){

      var
        self = this,
        sort = 'id',
        pkName = self.getNameOfPk((!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? name : req),
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req);

      // Get sort
      if (req.param(self.getParameterNameSort()) && _.isString(req.param(self.getParameterNameSort())) && _.trim(req.param(self.getParameterNameSort()))!=''){

        sort = _.trim(req.param(self.getParameterNameSort()));
      }
      else if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].defaultSort) && _.isString(Model[configKey].defaultSort) && _.trim(Model[configKey].defaultSort)!=''){

        sort = _.trim(Model[configKey].defaultSort);
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.defaultSort) && _.isString(config.defaultSort) && _.trim(config.defaultSort)!=''){

        sort = _.trim(config.defaultSort);
      }
      else if (!_.isUndefined(req.options.sort) && _.isString(req.options.sort) && _.trim(req.options.sort)!=''){

        sort = _.trim(req.options.sort);
      }

      // Validate sort and build the sort object
      var
        sortArray = sort.split(','),
        sortObject = {};

      for (var index in sortArray) {

        var
          dir = 1,
          sort = _.trim(sortArray[index]);

        // Get sort direction
        if (sort.charAt(0)=='-'){

          dir = 0;
        }

        // Kill sort identifier
        while(sort.charAt(0)=='-' || sort.charAt(0)=='+'){

          sort = _.trim(sort.substr(1));
        }

        // Matching `id` to primary key field
        if (sort=='id'){

          sort = pkName;
        }

        // Check if the field for the sorting exists and if yes, add it to the sort object
        if (!_.isUndefined(Model.attributes) && !_.isUndefined(Model.attributes[sort])){

          sortObject[sort] = dir;
        }
      }

      return sortObject;
    },

    parseSortToString: function(req, name) {

      var
        self = this,
        parameterNameSort = self.getParameterNameSort(),
        sortObj = self.parseSort(req, name),
        sortArr = [];

      for (var sort in sortObj) {

        sortArr.push((sortObj[sort]!=0 ? '': '-')+sort);
      }

      return !_.isUndefined(req.param(parameterNameSort)) ? (!sortArr.length ? '' : parameterNameSort+'='+sortArr.join(',')) : '';
    },

    /**
     * Get the name of the fields parameter to receive the favorite choice of the returned fields by an user.
     *
     * @return {String} The name of the fields parameter.
     */
    getParameterNameFields: function(){

      var
        self = this,
        parameterNameFields = 'fields';

      if (!_.isUndefined(config) && !_.isUndefined(config.parameterNameFields) && _.isString(config.parameterNameFields) && _.trim(config.parameterNameFields)!=''){

        parameterNameFields = _.trim(config.parameterNameFields);
      }

      return parameterNameFields;
    },

    /**
     * Parse the fields by the request object and optional depending on a different model.
     *
     * @param {Object} req The request object.
     * @param {String} name Optional the model name.
     *
     * @return {Array} The parsed fields.
     */
    parseFields: function(req, name){

      var
        self = this,
        fields = false,
        pkName = self.getNameOfPk((!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? name : req),
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req),
        selectArray = [],
        selectArrayMaster = [];

      // Get fields
      if (req.param(self.getParameterNameFields()) && _.isString(req.param(self.getParameterNameFields())) && _.trim(req.param(self.getParameterNameFields()))!=''){

        fields = _.trim(req.param(self.getParameterNameFields()));
      }
      else if (!_.isUndefined(Model[configKey]) && !_.isUndefined(Model[configKey].defaultFields) && _.isString(Model[configKey].defaultFields) && _.trim(Model[configKey].defaultFields)!=''){

        fields = _.trim(Model[configKey].defaultFields);
      }
      else if (!_.isUndefined(config) && !_.isUndefined(config.defaultFields) && _.isString(config.defaultFields) && _.trim(config.defaultFields)!=''){

        fields = _.trim(config.defaultFields);
      }
      else if (!_.isUndefined(req.options.fields) && _.isString(req.options.fields) && _.trim(req.options.fields)!=''){

        fields = _.trim(req.options.fields);
      }

      // Build the select array master
      if (!_.isUndefined(Model.attributes) && _.size(Model.attributes)){

        for (var name in Model.attributes) {

          var
            field = (_.isString(name) && _.trim(name)!='' && !_.isFunction(Model.attributes[name]) && _.isObject(Model.attributes[name]) && _.isUndefined(Model.attributes[name].collection)) ? _.trim(name) : false;

          if (field){

            selectArrayMaster.push(field);
          }
        }

        if (_.size(selectArrayMaster)){

          selectArrayMaster = _.uniq(selectArrayMaster);
        }
      }

      // Validate fields and build the select array (only if fields found select array master is not empty)
      if (_.isString(fields) && _.trim(fields)!='' && _.size(selectArrayMaster)){

        var
          remove = false;

        // Check if we want show only a part of the fields or if we want remove some fields
        if (fields.charAt(0)=='-'){

          remove = true;
        }

        // Kill field action identifier
        while(fields.charAt(0)=='-' || fields.charAt(0)=='+'){

          fields = _.trim(fields.substr(1));
        }

        var
          fieldsArray = fields.split(',');

        // Only further work if fields array is not empty
        if (_.size(fieldsArray)){

          // If we have to remove some fields, copy the select array master in the select array
          if (remove){

            selectArray = selectArrayMaster.slice(0);
          }

          for (var index in fieldsArray) {

            var
              field = _.trim(fieldsArray[index]);

            // Matching `id` to primary key field
            if (field=='id'){

              field = pkName;
            }

            // If we have to remove some fields
            if (remove){

              var
                selectArrayIndex = selectArray.indexOf(field);

              if (selectArrayIndex!==-1){

                selectArray.splice(selectArrayIndex, 1);
              }
            }
            // If we have to show only some fields
            else {

              var
                selectArrayIndex = selectArrayMaster.indexOf(field);

              if (selectArrayIndex!==-1){

                selectArray.push(field);
              }
            }
          }
        }
      }

      // If select array is empty or have the same number of elements as the select array master set it to false
      if (!_.size(selectArray) || (_.size(selectArray) && _.size(selectArray)===_.size(selectArrayMaster))){

        selectArray = false;
      }

      return selectArray;
    },

    parseFieldsToString: function(req, name) {

      var
        self = this,
        Model = (!_.isUndefined(name) && _.isString(name) && _.trim(name)!='') ? self.modelGetByName(name) : self.modelGetByRequest(req),
        parameterNameFields = self.getParameterNameFields(),
        selectArray = self.parseFields(req, name),
        selectArrayMaster = [],
        selectString = false;

      if (selectArray!==false){

        // Build the select array master
        if (!_.isUndefined(Model.attributes) && _.size(Model.attributes)){

          for (var name in Model.attributes) {

            var
              field = (!_.isFunction(Model.attributes[name]) && _.isObject(Model.attributes[name]) && _.isString(name) && _.trim(name)!='') ? _.trim(name) : false;

            if (field){

              selectArrayMaster.push(field);
            }
          }

          if (_.size(selectArrayMaster)){

            selectArrayMaster = _.uniq(selectArrayMaster);
          }
        }

        if (selectArray.length>(selectArrayMaster.length/2)){

          selectArrayMaster = selectArrayMaster.filter(function(el){

            return selectArray.indexOf(el)===-1;
          });

          selectString = '-'+selectArrayMaster.join(',');
        }
        else {

          selectString = selectArray.join(',');
        }
      }

      return selectString===false ? '' : (!_.isUndefined(req.param(parameterNameFields)) ? parameterNameFields+'='+selectString : '');
    },

    getPaginationUrls : function(req, countResults, name){

      var
        self = this,
        currentUrl = self.getCurrentUrl(req, true),
        paginationUrls = {};

      if (!countResults || isNaN(parseInt(countResults))){

        return paginationUrls;
      }

      var
        countResults = parseInt(countResults),
        perPage = self.parseLimit(req, name),
        currentPage = self.parsePage(req, name),
        firstPage = 1,
        lastPage = Math.ceil(countResults/perPage),
        prevPage = (currentPage-1)<firstPage ? firstPage : (currentPage-1),
        nextPage = (currentPage+1)>lastPage ? lastPage : (currentPage+1),
        parameterArr = [],
        parameters = '',
        sort = self.parseSortToString(req, name),
        populate = self.parsePopulateToString(req),
        populateLimit = self.parsePopulateLimitToString(req),
        criteria = self.parseCriteriaToString(req, name),
        fields = self.parseFieldsToString(req, name),
        pretty = self.parsePrettyToString(req),
        envelope = self.parseEnvelopeToString(req),
        jsonp = self.parseJsonpToString(req);

      if (sort!=''){

        parameterArr.push(sort);
      }

      if (populate!=''){

        parameterArr.push(populate);
      }

      if (populateLimit!=''){

        parameterArr.push(populateLimit);
      }

      if (criteria!=''){

        parameterArr.push(criteria);
      }

      if (fields!=''){

        parameterArr.push(fields);
      }

      if (pretty!=''){

        parameterArr.push(pretty);
      }

      if (envelope!=''){

        parameterArr.push(envelope);
      }

      if (jsonp!=''){

        parameterArr.push(jsonp);
      }

      parameters = parameterArr.join('&');

      var
        urlBeforePage = currentUrl+'?'+self.getParameterNamePage(req, name)+'=',
        urlAfterPage = self.parseLimitToString(req)+(parameters!='' ? parameters : '');

      // If the current page is not the first page
      if (currentPage!==firstPage){

        if (firstPage==1){

          paginationUrls.first = currentUrl+(urlAfterPage!='' ? '?'+urlAfterPage : '');
        }
        else {

          paginationUrls.first = urlBeforePage+firstPage+(urlAfterPage!='' ? '&'+urlAfterPage : '');
        }

        if (firstPage==1 && prevPage==firstPage){

          paginationUrls.prev = currentUrl+(urlAfterPage!='' ? '?'+urlAfterPage : '');
        }
        else {

          paginationUrls.prev = urlBeforePage+prevPage+(urlAfterPage!='' ? '&'+urlAfterPage : '');
        }
      }

      // If the current page is not the last page
      if (currentPage!==lastPage){

        paginationUrls.next = urlBeforePage+nextPage+(urlAfterPage!='' ? '&'+urlAfterPage : '');
        paginationUrls.last = urlBeforePage+lastPage+(urlAfterPage!='' ? '&'+urlAfterPage : '');
      }

      return paginationUrls;
    }
  };

module.exports = apiUtil;
