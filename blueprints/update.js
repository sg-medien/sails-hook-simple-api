/**
 * Blueprint dependencies
 */
var
  apiUtil = require('../lib/apiUtil'),
  _ = require('lodash'),
  util = require('util');

/**
 * Update One Record
 *
 * An API call to update a model instance with the specified `id`,
 * treating the other unbound parameters as attributes.
 *
 * @param {Integer|String} id  - the unique id of the particular record you'd like to update  (Note: this param should be specified even if primary key is not `id`!!)
 * @param *                    - values to set on the record
 *
 */
module.exports = function updateOneRecord(req, res) {

  // Look up the model
  var
    Model = apiUtil.modelGetByRequest(req);

  // Look up the required primary key
  var
    pk = apiUtil.parseRequiredPk(req);

  // Parse `values` by the request object
  var
    values = apiUtil.parseValues(req);

  // No matter what, don't allow changing the PK via the update blueprint
  // (you should just drop and re-add the record if that's what you really want)
  if (typeof values[Model.primaryKey] !== 'undefined' && values[Model.primaryKey] != pk) {

    req._sails.log.warn('Cannot change primary key via update blueprint; ignoring value sent for `' + Model.primaryKey + '`');
  }

  // Make sure the primary key is unchanged
  if (!_.isUndefined(values[Model.primaryKey])){

    delete values[Model.primaryKey];
  }

  // Parse `criteria` by the request object
  var
    criteria = apiUtil.parseCriteria(req);

  // Find and update the targeted record.
  //
  // (Note: this could be achieved in a single query, but a separate `findOne`
  //  is used first to provide a better experience for front-end developers
  //  integrating with the blueprint API.)
  var
    query = Model.findOne()
    .where(criteria)
    .sort(apiUtil.parseSort(req));

  // Populate the query according to the current "populate" settings
  query = apiUtil.populate(query, req);

  query.exec(function found(err, matchingRecord) {

    if (err) return res.negotiate(err);
    if(!matchingRecord) return res.notFound(matchingRecord);

    // Only update if different data passed
    if (!apiUtil.modelCompareInput(values, matchingRecord)) {

      Model.update(matchingRecord[Model.primaryKey], values).exec(function updated(err, records) {

        // Differentiate between waterline-originated validation errors
        // and serious underlying issues. Respond with badRequest if a
        // validation error is encountered, w/ validation info.
        if (err) return res.negotiate(err);

        // Because this should only update a single record and update
        // returns an array, just use the first item.  If more than one
        // record was returned, something is amiss.
        if (!records || !records.length || records.length > 1) {
          req._sails.log.warn(
            util.format('Unexpected output from `%s.update`.', Model.globalId)
          );
        }

        // If we have the pubsub hook, use the Model's publish method
        // to notify all subscribers about the update.
        if (req._sails.hooks.pubsub) {

          if (req.isSocket) { Model.subscribe(req, records); }
          Model.publishUpdate(pk, _.cloneDeep(values), !req.options.mirror && req, {

            previous: _.cloneDeep(matchingRecord.toJSON())
          });
        }

        // Send response
        response(records[0]);
      });
    }
    else {

      // Send response
      response(matchingRecord);
    }
  });

  // Response method
  var
    response = function response(record){

      // Do a final query to populate the associations of the record.
      //
      // (Note: again, this extra query could be eliminated, but it is
      //  included by default to provide a better interface for integrating
      //  front-end developers.)
      var
        W = {};
      W[Model.primaryKey] = record[Model.primaryKey];

      var
        Q = Model.findOne({ select: apiUtil.parseFields(req) })
          .where(W);

      // Populate the query according to the current "populate" settings
      Q = apiUtil.populate(Q, req);

      Q.exec(function foundAgain(err, populatedRecord) {

        if (err) return res.negotiate(err);
        if(!populatedRecord) return res.notFound(populatedRecord);

        // Send response
        res.ok(populatedRecord);
      });
    };
};
