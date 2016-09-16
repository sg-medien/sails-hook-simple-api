/**
 * Blueprint dependencies
 */
var
  actionUtil = require('../lib/actionUtil'),
  apiUtil = require('../lib/apiUtil'),
  _ = require('lodash');

/**
 * Populate (or "expand") an association
 *
 * get /model/:parentid/relation
 * get /model/:parentid/relation/:id
 *
 * @param {Integer|String} parentid  - the unique id of the parent instance
 * @param {Integer|String} id  - the unique id of the particular child instance you'd like to look up within this relation
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 *
 * @option {String} model  - the identity of the model
 * @option {String} alias  - the name of the association attribute (aka "alias")
 */

module.exports = function expand(req, res) {

  // Look up the model
  var
    Model = apiUtil.modelGetByRequest(req);

  var
    relation = req.options.alias;
  if (!relation || !Model) return res.serverError();

  var
    parentPk = req.param('parentid');
  if (!parentPk) return res.notFound();

  // Parse `criteria` by the request object
  var
    criteria = apiUtil.parseCriteria(req);

  var populate = sails.util.objCompact({

    where: criteria,
    paginate: { page: apiUtil.parsePage(req), limit: apiUtil.parseLimit(req) },
    sort: apiUtil.parseSort(req)
  });

  Model
    .findOne(parentPk)
    .populate(relation, populate)
    .exec(function found(err, matchingRecord) {

      if (err) return res.negotiate(err);
      if(!matchingRecord) return res.notFound(matchingRecord);
      if (!matchingRecord[relation]) return res.notFound(util.format('Specified record (%s) is missing relation `%s`', parentPk, relation));

      // Subcribe to instance, if relevant
      // TODO: only subscribe to populated attribute- not the entire model
      if (sails.hooks.pubsub && req.isSocket) {

        Model.subscribe(req, matchingRecord);
        actionUtil.subscribeDeep(req, matchingRecord);
      }

      // Send response
      res.ok(matchingRecord[relation]);
    });
};
