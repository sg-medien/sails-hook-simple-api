/**
 * Blueprint dependencies
 */
var
  apiUtil = require('../lib/apiUtil'),
  _ = require('lodash');

/**
 * Destroy One Record
 *
 * delete  /:modelIdentity/:id
 *    *    /:modelIdentity/destroy/:id
 *
 * Destroys the single model instance with the specified `id` from
 * the data adapter for the given model if it exists.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to delete
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */
module.exports = function destroyOneRecord(req, res) {

  // Look up the model
  var
    Model = apiUtil.modelGetByRequest(req);

  // Look up the required primary key
  var
    pk = apiUtil.parseRequiredPk(req);

  // Parse `criteria` by the request object
  var
    criteria = apiUtil.parseCriteria(req);

  var
    query = Model.findOne({ select: apiUtil.parseFields(req) })
    .where(criteria)
    .sort(apiUtil.parseSort(req));

  // Populate the query according to the current "populate" settings
  query = apiUtil.populate(query, req);

  query.exec(function foundRecord(err, record) {

    if (err) return res.negotiate(err);
    if(!record) return res.notFound(record);

    Model.destroy(record[Model.primaryKey]).exec(function destroyedRecord(err) {

      if (err) return res.negotiate(err);

      if (req._sails.hooks.pubsub) {

        Model.publishDestroy(pk, !req._sails.config.blueprints.mirror && req, {previous: record});

        if (req.isSocket) {

          Model.unsubscribe(req, record);
          Model.retire(record);
        }
      }

      // Send response
      res.ok(record);
    });
  });
};
