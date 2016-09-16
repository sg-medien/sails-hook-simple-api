/**
 * Blueprint dependencies
 */
var
  apiUtil = require('../lib/apiUtil'),
  _ = require('lodash');

/**
 * Create Record
 *
 * post /:modelIdentity
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified criteria.  If an id was specified, just the instance with
 * that unique id will be returned.
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 * @param {*} * - other params will be used as `values` in the create
 */
module.exports = function createRecord(req, res) {

  // Look up the model
  var
    Model = apiUtil.modelGetByRequest(req);

  // Parse `values` by the request object
  var
    values = apiUtil.parseValues(req);

	// Create new instance of model using values from params
	Model.create(values).exec(function created (err, newInstance) {

    if (err) return res.negotiate(err);

		// If we have the pubsub hook, use the model class's publish method
		// to notify all subscribers about the created item
		if (req._sails.hooks.pubsub) {

			if (req.isSocket) {

				Model.subscribe(req, newInstance);
				Model.introduce(newInstance);
			}
			// Make sure data is JSON-serializable before publishing
			var publishData = _.isArray(newInstance) ? _.map(newInstance, function(instance) {return instance.toJSON();}) : newInstance.toJSON();
			Model.publishCreate(publishData, !req.options.mirror && req);
		}

    // Do a final query to populate the associations of the record.
    //
    // (Note: again, this extra query could be eliminated, but it is
    //  included by default to provide a better interface for integrating
    //  front-end developers.)
    var
      W = {};
    W[Model.primaryKey] = newInstance[Model.primaryKey];
    var
      Q = Model.findOne({ select: apiUtil.parseFields(req) })
        .where(W);

    // Populate the query according to the current "populate" settings
    Q = apiUtil.populate(Q, req);

    Q.exec(function found(err, populatedRecord) {

      if (err) return res.negotiate(err);
      if(!populatedRecord) return res.notFound(populatedRecord);

      // Send response
      res.created(populatedRecord);
    });
	});
};
