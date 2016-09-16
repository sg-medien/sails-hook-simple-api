/**
 * Hook dependencies
 */
var
  _ = require('lodash'),
  path = require('path'),
  buildDictionary = require('sails-build-dictionary'),
  apiUtil = require('./lib/apiUtil');

module.exports = function apiExtended(sails) {

  return {

    /**
     * Hook defaults
     */
    defaults: {

      __configKey__: {

        // name : 'Extended sails api',
        // version : 1,
        // hostname : 'api.domain.tld',
        // compression : true,
        compressionOptions : false,
        // minify : true,
        methodOverride : false,
        parameterNameMethodOverride : '_method',
        headerNameMethodOverride : 'X-Http-Method-Override',
        pretty : false,
        parameterNamePretty : 'pretty',
        defaultEnvelope : false,
        parameterNameEnvelope : 'envelope',
        envelopeResponseKey : 'response',
        jsonp : false,
        jsonpAutoEnvelope : true,
        parameterNameJsonp : 'callback',
        defaultPage : 1,
        parameterNamePage : 'page',
        defaultLimit : 30,
        parameterNameLimit : 'limit',
        maximumLimit : 100,
        defaultPopulate : false,
        parameterNamePopulate : 'populate',
        // defaultPopulateLimit : 30,
        parameterNamePopulateLimit : 'populateLimit',
        // maximumPopulateLimit : 100,
        parameterNameSort : 'sort',
        defaultSort : 'id',
        parameterNameFields : 'fields',
        defaultFields : false
      }
    },

    /**
     * Hook configuration
     */
    configure: function() {

      var
        self = this;

      // Initialize api util
      apiUtil.init(self.configKey);

      // Only if the http hook was found
      if (sails.hooks.http) {

        // Replace the http middleware 'compress' if no custom middleware exists
        if (_.isUndefined(sails.config.http.middleware.compress)) {

          sails.config.http.middleware.compress = httpMiddlewareCompress;
        }

        // Replace the http middleware 'methodOverride' if no custom middleware exists
        if (_.isUndefined(sails.config.http.middleware.methodOverride)) {

          sails.config.http.middleware.methodOverride = httpMiddlewareMethodOverride;
        }

        // Replace the http middleware 'poweredBy' if no custom middleware exists
        if (_.isUndefined(sails.config.http.middleware.poweredBy)) {

          sails.config.http.middleware.poweredBy = httpMiddlewarePoweredBy;
        }
      }
    },

    /**
     * Hook initialization
     *
     * @param  {Function} cb
     */
    initialize: function(cb) {

      var
        self = this;

      // Only if the http, blueprints and responses hook was found
      if (sails.hooks.http && sails.hooks.blueprints && sails.hooks.responses) {

        // Inject custom blueprints
        injectCustomBlueprints(function customBlueprintsInjected(err){

          if (err) return cb(err);

          // Inject custom responses
          injectCustomResponses(function customResponsesInjected(err){

            if (err) return cb(err);

            // Hook loaded
            return cb();
          });
        });
      }
      else {

        // Hook loaded, but without changes
        return cb();
      }
    }
  };

  /**
   * Inject custom api blueprints.
   *
   * @param {Function} cb
   */
  function injectCustomBlueprints(cb) {

    buildDictionary.optional({

      dirname: path.resolve(__dirname, 'blueprints'),
      filter: new RegExp('(.+)\\.(' + sails.config.moduleloader.sourceExt.join('|') + ')$'),
      useGlobalIdForKeyName: true
    }, function customBlueprintsLoaded(err, customBlueprints){

      if (err) return cb(err);

      // If some custom blueprints found
      if (_.size(customBlueprints)){

        // Load default blueprints
        sails.modules.loadBlueprints(function defaultBlueprintsLoaded(err, defaultBlueprints) {

          if (err) return cb(err);

          // Add custom blueprints
          _.each(customBlueprints, function(customBlueprint, name) {

            // Add custom blueprint (only if we could not find a default blueprint with the same name)
            if (_.isUndefined(defaultBlueprints[name.toLowerCase()])){

              // Remove identity if it exists
              if (!_.isUndefined(customBlueprint.identity)){

                delete customBlueprint.identity;
              }

              // Remove globalId if it exists
              if (!_.isUndefined(customBlueprint.globalId)){

                delete customBlueprint.globalId;
              }

              // Add _middlewareType key to the blueprint function, for debugging
              customBlueprint._middlewareType = 'BLUEPRINT: '+customBlueprint.name || name;

              // Add custom blueprint
              sails.hooks.blueprints.middleware[name.toLowerCase()] = customBlueprint;
            }
          });

          return cb();
        });
      }
      else {

        return cb();
      }
    });
  }

  /**
   * Inject custom api responses.
   *
   * @param {Function} cb
   */
  function injectCustomResponses(cb) {

    buildDictionary.optional({

      dirname: path.resolve(__dirname, 'responses'),
      filter: new RegExp('(.+)\\.(' + sails.config.moduleloader.sourceExt.join('|') + ')$'),
      useGlobalIdForKeyName: true
    }, function customResponsesLoaded(err, customResponses){

        if (err) return cb(err);

        // If some custom responses found
        if (_.size(customResponses)){

          // Load default responses
          sails.modules.loadResponses(function defaultResponsesLoaded(err, defaultResponses) {

            if (err) return cb(err);

            // Add custom responses
            _.each(customResponses, function(customResponse, name) {

              // Bind and add custom response (only if we could not find a default response with the same name)
              if (_.isUndefined(defaultResponses[name])){

                // Add a reference to the Sails app that loaded the response
                customResponse.sails = sails;

                // Bind all methods to the response context
                _.bindAll(customResponse);

                // Add custom response
                sails.hooks.responses.middleware[name] = customResponse;
              }
            });

            return cb();
          });
        }
        else {

          return cb();
        }
    });
  }

  /**
   * Http middleware compress.
   *
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  function httpMiddlewareCompress(req, res, next){

    var
      config = apiUtil.getConfig(),
      useCompression = (config && !_.isUndefined(config.compression) && _.isBoolean(config.compression)) ? config.compression : process.env.NODE_ENV === 'production',
      options = (config && !_.isUndefined(config.compressionOptions) && _.isObject(config.compressionOptions)) ? config.compressionOptions : {};

    if (useCompression){

      var
        compression = require('compression')(options);

      compression(req, res, next);
    }
    else {

      return next();
    }
  }

  /**
   * Http middleware `methodOverride`.
   *
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  function httpMiddlewareMethodOverride(req, res, next){

    var
      config = apiUtil.getConfig(),
      methodOverride = (config && !_.isUndefined(config.methodOverride) && _.isBoolean(config.methodOverride)) ? config.methodOverride : false;

    if (methodOverride){

      var
        method,
        methodOverridParameterName = apiUtil.getParameterNameMethodOverride(),
        methodOverridHeaderName = apiUtil.getHeaderNameMethodOverride();

      req.originalMethod = req.originalMethod || req.method;

      // Check req.body
      if (req.body && _.isObject(req.body) && methodOverridParameterName in req.body) {

        method = req.body[methodOverridParameterName].toLowerCase();
        delete req.body[methodOverridParameterName];
      }

      // Check the method override header
      if (req.headers[methodOverridHeaderName.toLowerCase()]) {

        method = req.headers[methodOverridHeaderName.toLowerCase()].toLowerCase();
      }

      // Replace original method if the new method is supported by the current node js version
      if (method && methods.indexOf(method)) {

        req.method = method.toUpperCase();
      }
    }

    return next();
  }

  /**
   * Http middleware `poweredBy`.
   *
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  function httpMiddlewarePoweredBy(req, res, next){

    var
      config = apiUtil.getConfig(),
      poweredByName = apiUtil.getName();

    if (poweredByName){

      res.header('X-Powered-By', poweredByName);
    }

    return next();
  }
};
