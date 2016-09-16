/**
 * Blueprint dependencies
 */
var
  actionUtil = require('../lib/actionUtil'),
  apiUtil = require('../lib/apiUtil'),
  _ = require('lodash');

/**
 * Find One Record
 *
 * get /:modelIdentity/:id
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified id.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to look up *
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findOneRecord(req, res) {

  // Look up the model
  var
    Model = apiUtil.modelGetByRequest(req);

  // Look up the required primary key
  var
    pk = apiUtil.parseRequiredPk(req);

  // Parse `criteria` by the request object
  var
    criteria = apiUtil.parseCriteria(req);

  // Lookup for one record that match the specified criteria
  var
    query = Model.findOne({ select: apiUtil.parseFields(req) })
    .where(criteria)
    .sort(apiUtil.parseSort(req));

  // Populate the query according to the current "populate" settings
  query = apiUtil.populate(query, req);

  query.exec(function found(err, matchingRecord) {

    if (err) return res.negotiate(err);
    if(!matchingRecord) return res.notFound(matchingRecord);

    if (req._sails.hooks.pubsub && req.isSocket) {

      Model.subscribe(req, matchingRecord);
      actionUtil.subscribeDeep(req, matchingRecord);
    }

    // Send response
    res.ok(matchingRecord);
  });
};
