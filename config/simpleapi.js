module.exports.simpleapi = {

  /****************************************************************************
  *                                                                           *
  * The name of your api. Used e.g. for the `x-powered-by`-header.            *
  *                                                                           *
  ****************************************************************************/

  // name : 'Simple api',

  /****************************************************************************
  *                                                                           *
  * The version of your api. Used e.g. for the `x-powered-by`-header.         *
  *                                                                           *
  ****************************************************************************/

  // version : 1,

  /****************************************************************************
  *                                                                           *
  * The explicit hostname of your api. Used e.g. for the pagination urls.     *
  *                                                                           *
  ****************************************************************************/

  // hostname : 'api.domain.tld',

  /****************************************************************************
  *                                                                           *
  * Compress the output of your api? Use `true` or `false`. If you do not     *
  * specify, the output of your api will only be compressed if the            *
  * api run in `production` environment.                                      *
  *                                                                           *
  ****************************************************************************/

  // compression : true,

  /****************************************************************************
  *                                                                           *
  * If the compression is enabled you can specify some compression options    *
  * here. More infos about the available options you find here:               *
  * https://www.npmjs.com/package/compression                                 *
  *                                                                           *
  ****************************************************************************/

  // compressionOptions : false,

  /****************************************************************************
  *                                                                           *
  * Minify the json output of your api? Use `true` or `false`. If you do not  *
  * specify, the json output of your api will only be minified if your        *
  * api run in `production` environment.                                      *
  *                                                                           *
  ****************************************************************************/

  // minify : true,

  /****************************************************************************
  *                                                                           *
  * Enable the possibility to override the original http method? Use `true`   *
  * or `false`. By default the possibility is disabled.                       *
  *                                                                           *
  ****************************************************************************/

  // methodOverride : false,

  /****************************************************************************
  *                                                                           *
  * The name of the method override parameter to replace the original http    *
  * method.                                                                   *
  *                                                                           *
  ****************************************************************************/

  // parameterNameMethodOverride : '_method',

  /****************************************************************************
  *                                                                           *
  * The name of the method override header to replace the original http       *
  * method.                                                                   *
  *                                                                           *
  ****************************************************************************/

  // headerNameMethodOverride : 'X-Http-Method-Override',

  /****************************************************************************
  *                                                                           *
  * Enables the possibility to override the minify setting by a custom        *
  * parameter. Use `true` or `false`. By default the possibility is disabled. *
  *                                                                           *
  ****************************************************************************/

  // pretty : false,

  /****************************************************************************
  *                                                                           *
  * The name of the pretty parameter, if the pretty setting is enabled, to    *
  * receive a favorite minify setting by an user. Possible settings are `1`,  *
  * `true`, `0` or `false`.                                                   *
  *                                                                           *
  ****************************************************************************/

  // parameterNamePretty : 'pretty',

  /****************************************************************************
  *                                                                           *
  * The default envelope setting to show a response of data. Use `true` or    *
  * `false`. By default the setting is disabled.                              *
  *                                                                           *
  ****************************************************************************/

  // defaultEnvelope : false,

  /****************************************************************************
  *                                                                           *
  * The name of the envelope parameter to receive a favorite envelope setting *
  * by an user. Possible settings are `1`, `true`, `0` or `false`.            *
  *                                                                           *
  ****************************************************************************/

  // parameterNameEnvelope : 'envelope',

  /****************************************************************************
  *                                                                           *
  * The name of the key which is used to envelope the return of the response  *
  * data (if envelope is enabled).                                            *
  *                                                                           *
  ****************************************************************************/

  // envelopeResponseKey : 'response',

  /****************************************************************************
  *                                                                           *
  * Enables the possibility to send jsonp requests. Use `true` or `false`.    *
  * By default the possibility is disabled.                                   *
  *                                                                           *
  ****************************************************************************/
  // jsonp : false,

  /****************************************************************************
  *                                                                           *
  * Enables the envelope setting automatically if a jsonp request sent.       *
  * Use `true` or `false`. By default the setting is enabled.                 *
  *                                                                           *
  ****************************************************************************/
  // jsonpAutoEnvelope : true,

  /****************************************************************************
  *                                                                           *
  * The name of the jsonp parameter to receive a favorite jsonp callback      *
  * function name by an user.                                                 *
  *                                                                           *
  ****************************************************************************/
  // parameterNameJsonp : 'callback',

  /****************************************************************************
  *                                                                           *
  * The default page number to show in the response from a `find` action.     *
  * You can override this default setting individually for each model. Just   *
  * add `_config: { defaultPage: 1 }` to your favorite model. Other           *
  * models without an individual setting, use the following default setting.  *
  *                                                                           *
  ****************************************************************************/

  // defaultPage : 1,

  /****************************************************************************
  *                                                                           *
  * The name of the page parameter to receive a favorite page by an user.     *
  *                                                                           *
  ****************************************************************************/

  // parameterNamePage : 'page',

  /****************************************************************************
  *                                                                           *
  * The default number of records to show in the response from a `find`       *
  * action. You can override this default setting individually for each       *
  * model. Just add `_config: { defaultLimit: 30 }` to your favorite          *
  * model. Other models without an individual setting, use the following      *
  * default setting.                                                          *
  *                                                                           *
  ****************************************************************************/

  // defaultLimit : 30,

  /****************************************************************************
  *                                                                           *
  * The name of the limit parameter to receive a favorite limit per page      *
  * by an user.                                                               *
  *                                                                           *
  ****************************************************************************/

  // parameterNameLimit : 'limit',

  /****************************************************************************
  *                                                                           *
  * The maximum allowed number of records to show in the response from a      *
  * `find` action. Use `false` for no limitation. You can override this       *
  * default setting individually for each model. Just add                     *
  * `_config: { maximumLimit: 100 }` to your favorite model. Other models     *
  * without an individual setting, use the following default setting.         *
  *                                                                           *
  ****************************************************************************/

  // maximumLimit : 100,

  /****************************************************************************
  *                                                                           *
  * The default populate setting to show a response of data. Use `true` or    *
  * `false` to populate or hide all associations. You can also pass a         *
  * comma-separated string or an array with certain associations. You can     *
  * override this default setting individually for each model. Just add       *
  * `_config: { defaultPopulate: false }` to your favorite model. Other       *
  * models without an individual setting, use the following default setting.  *
  *                                                                           *
  ****************************************************************************/

  // defaultPopulate : false,

  /****************************************************************************
  *                                                                           *
  * The name of the populate parameter to receive a favorite populate setting *
  * by an user. Possible settings are `1`, `true`, `0`, `false` or a          *
  * comma-separated string with certain associations.                         *
  *                                                                           *
  ****************************************************************************/

  // parameterNamePopulate : 'populate',

  /****************************************************************************
  *                                                                           *
  * The default number of populated records to show in the response from a    *
  * `find` action. You can override this default setting individually for     *
  * each model. Just add `_config: { defaultPopulateLimit: 30 }` to your      *
  * favorite model. Other models without an individual setting, use the       *
  * following default setting. If the `defaultPopulateLimit` is nowhere set   *
  * we use the `defaultLimit`.                                                *
  *                                                                           *
  ****************************************************************************/

  // defaultPopulateLimit : 30,

  /****************************************************************************
  *                                                                           *
  * The name of the populate limit parameter to receive a favorite populate   *
  * limit by an user.                                                         *
  *                                                                           *
  ****************************************************************************/

  // parameterNamePopulateLimit : 'populateLimit',

  /****************************************************************************
  *                                                                           *
  * The maximum allowed number of populated records to show in the response   *
  * from a `find` action. Use `false` for no limitation. You can override     *
  * this default setting individually for each model. Just add                *
  * `_config: { maximumPopulateLimit: 100 }` to your favorite model.          *
  * Other models without an individual setting, use the following default     *
  * setting. If the `maximumPopulateLimit` is nowhere set we use the          *
  * `maximumLimit`.                                                           *
  *                                                                           *
  ****************************************************************************/

  // maximumPopulateLimit : 100,

  /****************************************************************************
  *                                                                           *
  * The name of the sort parameter to receive a favorite sorting              *
  * by an user.                                                               *
  *                                                                           *
  ****************************************************************************/

  // parameterNameSort : 'sort',

  /****************************************************************************
  *                                                                           *
  * The default sort of records to show in the response from a `find` or      *
  * a `findOne` action. Pass the name(s) of (an) attribute(s) to get an       *
  * individual sorting of the records. The default direction for each sort    *
  * attribute is ascending, use a `-` before the attribute name for           *
  * descending sort. Separate several sorts by a comma. Note: `id` matches    *
  * automatically the primary key attribute. Have no fear to use unavailable  *
  * attributes, they will be automatically ignored. You can override this     *
  * default setting individually for each model. Just add                     *
  * `_config: { defaultSort: 'id' }` to your favorite model. Other models     *
  * without an individual setting, use the following default setting.         *
  *                                                                           *
  ****************************************************************************/

  // defaultSort : 'id',

  /****************************************************************************
  *                                                                           *
  * The name of the fields parameter to receive a favorite choice of the      *
  * returned fields by an user.                                               *
  *                                                                           *
  ****************************************************************************/

  // parameterNameFields : 'fields',

  /****************************************************************************
  *                                                                           *
  * The default fields of records to show in the response from a `find` or    *
  * a `findOne` action. Pass the name(s) of (an) attribute(s) to get an       *
  * individual set of the returned record fields. Use a `-` at the            *
  * beginning to exclude the fields from the records. Separate your favorite  *
  * fields by a comma or use `false` to return all available fields. Note:    *
  * `id` matches automatically the primary key attribute. Have no fear to use *
  * unavailable fields, they will be automatically ignored. You can override  *
  * this default setting individually for each model. Just add                *
  * `_config: { defaultFields: false }` to your favorite model. Other         *
  * models without an individual setting, use the following default setting.  *
  *                                                                           *
  ****************************************************************************/

  // defaultFields : false
};
