/**
 * Module dependencies
 */
var
  _ = require('lodash');

/**
 * Utility methods used by the hook.
 *
 * @type {Object}
 */
var actionUtil = {

  /**
   * Subscribe deep (associations)
   *
   * @param  {[type]} associations [description]
   * @param  {[type]} record       [description]
   * @return {[type]}              [description]
   */
  subscribeDeep: function ( req, record ) {

    _.each(req.options.associations, function (assoc) {

      // Look up identity of associated model
      var ident = assoc[assoc.type];
      var AssociatedModel = req._sails.models[ident];

      if (req.options.autoWatch) {

        AssociatedModel.watch(req);
      }

      // Subscribe to each associated model instance in a collection
      if (assoc.type === 'collection') {

        _.each(record[assoc.alias], function (associatedInstance) {

          AssociatedModel.subscribe(req, associatedInstance);
        });
      }
      // If there is an associated to-one model instance, subscribe to it
      else if (assoc.type === 'model' && record[assoc.alias]) {

        AssociatedModel.subscribe(req, record[assoc.alias]);
      }
    });
  }
};

module.exports = actionUtil;
