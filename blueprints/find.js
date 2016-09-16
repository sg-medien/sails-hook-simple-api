/**
 * Blueprint dependencies
 */
var
  actionUtil = require('../lib/actionUtil'),
  apiUtil = require('../lib/apiUtil'),
  _ = require('lodash');

/**
 * Find Records
 *
 *  get   /:modelIdentity
 *   *    /:modelIdentity/find
 *
 * An API call to find and return model instances from the data adapter
 * using the specified criteria.  If an id was specified, just the instance
 * with that unique id will be returned.
 *
 * Optional:
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findRecords(req, res) {

  // Look up the model
  var
    Model = apiUtil.modelGetByRequest(req);

  // Parse `criteria` by the request object
  var
    criteria = apiUtil.parseCriteria(req);

  // Lookup for records that match the specified criteria
  var
    query = Model.find({ select: apiUtil.parseFields(req) })
    .where(criteria)
    .paginate({ page: apiUtil.parsePage(req), limit: apiUtil.parseLimit(req) })
    .sort(apiUtil.parseSort(req));

  // Populate the query according to the current "populate" settings
  query = apiUtil.populate(query, req);

  query.exec(function found(err, matchingRecords) {

    if (err) return res.negotiate(err);

    // Clear matching records if objects are empty
    if (matchingRecords && matchingRecords.length) {

      if ((_.isFunction(matchingRecords[0].toJSON) && (!_.isObject(matchingRecords[0].toJSON()) || !_.size(matchingRecords[0].toJSON()))) || (!_.isFunction(matchingRecords[0].toJSON) && (!_.isObject(matchingRecords[0]) || !_.size(matchingRecords[0])))) {

        matchingRecords = [];
      }
    }

    if ((!matchingRecords || !matchingRecords.length) && _.size(criteria)) return res.notFound(matchingRecords);

    Model.count().where(criteria).exec(function countCB(err, matchingRecordsCount) {

      if (err) return res.negotiate(err);

      var
        paginationUrls = apiUtil.getPaginationUrls(req, matchingRecordsCount),
        headerLinkArr = [],
        headerLink = '';

      // Add x-total-count header
      res.set('X-Total-Count', matchingRecordsCount);

      // Build link header
      for (var rel in paginationUrls) {

        headerLinkArr.push('<' + paginationUrls[rel] + '>; rel="' + rel + '"');
      }
      headerLink = headerLinkArr.join(',\n');

      // Add link header if not empty
      if (headerLink != '') {

        res.set('Link', headerLink);
      }

      // Only `.watch()` for new instances of the model if
      // `autoWatch` is enabled.
      if (req._sails.hooks.pubsub && req.isSocket) {
        Model.subscribe(req, matchingRecords);
        if (req.options.autoWatch) { Model.watch(req); }
        // Also subscribe to instances of all associated models
        _.each(matchingRecords, function (record) {
          actionUtil.subscribeDeep(req, record);
        });
      }

      // Send response
      res.ok(matchingRecords);
    });
  });
};
