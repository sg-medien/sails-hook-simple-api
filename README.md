<h1>
<a href="http://sailsjs.org"><img alt="Sails.js logo" src="http://balderdashy.github.io/sails/images/logo.png" title="Sails.js"/></a><br><br>sails-hook-simple-api
</h1>

---

[![npm version](https://badge.fury.io/js/sails-hook-simple-api.svg)](https://badge.fury.io/js/sails-hook-simple-api)
[![Dependencies](https://david-dm.org/sg-medien/sails-hook-simple-api.svg)](https://david-dm.org/sg-medien/sails-hook-simple-api)

---

*Needs at least Sails version 0.12.0 to work.*

[Sails JS](http://sailsjs.org) hook which extends the features of the sails blueprint api. Inspired by the article "[Best Practices for Designing a Pragmatic RESTful API](http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api)".

### Installation

`npm install sails-hook-simple-api --save`

### Configuration

By default, configuration lives in `sails.config.simpleapi`. The configuration key (`simpleapi`) can be changed by setting `sails.config.hooks['sails-hook-simpleapi'].configKey`.

Parameter      | Type                | Details
-------------- | ------------------- |:---------------------------------
name | `string` | The name of your api. Used e.g. for the `x-powered-by`-header.
version | `float` | The version of your api. Used e.g. for the `x-powered-by`-header.
hostname | `string` | The explicit hostname of your api. Used e.g. for the pagination urls.
compression | `boolean` | Compress the output of your api? Use `true` or `false`. If you do not specify, the output of your api will only be compressed if the api run in `production` environment.
compressionOptions | `object|boolean` | If the compression is enabled you can specify some compression options here. More infos about the available options you find [here](https://www.npmjs.com/package/compression).
minify | `boolean` | Minify the json output of your api? Use `true` or `false`. If you do not specify, the json output of your api will only be minified if your api run in `production` environment.
methodOverride | `boolean` | Enable the possibility to override the original http method? Use `true` or `false`. Defaults to `false`.
parameterNameMethodOverride | `string` | The name of the method override parameter to replace the original http method. Defaults to `_method`.
headerNameMethodOverride | `string` | The name of the method override header to replace the original http method. Defaults to `X-Http-Method-Override`.
pretty | `boolean` | Enables the possibility to override the minify setting by a custom parameter. Use `true` or `false`. Defaults to `false`.
parameterNamePretty | `string` | The name of the pretty parameter, if the pretty setting is enabled, to receive a favorite minify setting by an user. Possible settings are `1`, `true`, `0` or `false`. Defaults to `pretty`.
defaultEnvelope | `boolean` | The default envelope setting to show a response of data. Use `true` or `false`. Defaults to `false`.
parameterNameEnvelope | `string` | The name of the envelope parameter to receive a favorite envelope setting by an user. Possible settings are `1`, `true`, `0` or `false`. Defaults to `envelope`.
envelopeResponseKey | `string` | The name of the key which is used to envelope the return of the response data (if envelope is enabled). Defaults to `response`.
jsonp | `boolean` | Enables the possibility to send jsonp requests. Use `true` or `false`. Defaults to `false`.
jsonpAutoEnvelope | `boolean` | Enables the envelope setting automatically if a jsonp request sent. Use `true` or `false`. Defaults to `true`.
parameterNameJsonp | `string` | The name of the jsonp parameter to receive a favorite jsonp callback function name by an user. Defaults to `callback`.
defaultPage | `integer` | The default page number to show in the response from a `find` action. You can override this default setting individually for each model. Just add `_config: { defaultPage: 1 }` to your favorite model. Other models without an individual setting, use this default setting. Defaults to `1`.
parameterNamePage | `string` | The name of the page parameter to receive a favorite page by an user. Defaults to `page`.
defaultLimit | `integer` | The default number of records to show in the response from a `find` action. You can override this default setting individually for each model. Just add `_config: { defaultLimit: 30 }` to your favorite model. Other models without an individual setting, use this default setting. Defaults to `30`.
parameterNameLimit | `string` | The name of the limit parameter to receive a favorite limit per page by an user. Defaults to `limit`.
maximumLimit | `integer|boolean` | The maximum allowed number of records to show in the response from a `find` action. Use `false` for no limitation. You can override this default setting individually for each model. Just add `_config: { maximumLimit: 100 }` to your favorite model. Other models without an individual setting, use this default setting. Defaults to `100`.
defaultPopulate | `boolean|string|array` | The default populate setting to show a response of data. Use `true` or `false` to populate or hide all associations. You can also pass a comma-separated string or an array with certain associations. You can override this default setting individually for each model. Just add `_config: { defaultPopulate: false }` to your favorite model. Other models without an individual setting, use this default setting. Defaults to `false`.
parameterNamePopulate | `string` | The name of the populate parameter to receive a favorite populate setting by an user. Possible settings are `1`, `true`, `0`, `false` or a comma-separated string with certain associations. Defaults to `populate`.
defaultPopulateLimit | `integer` | The default number of populated records to show in the response from a `find` action. You can override this default setting individually for each model. Just add `_config: { defaultPopulateLimit: 30 }` to your favorite model. Other models without an individual setting, use this default setting. If the `defaultPopulateLimit` is nowhere set we use the `defaultLimit`. Defaults to `defaultLimit`.
parameterNamePopulateLimit | `string` | The name of the populate limit parameter to receive a favorite populate limit by an user. Defaults to `populateLimit`.
maximumPopulateLimit | `integer|boolean` | The maximum allowed number of populated records to show in the response from a `find` action. Use `false` for no limitation. You can override this default setting individually for each model. Just add `_config: { maximumPopulateLimit: 100 }` to your favorite model. Other models without an individual setting, use this default setting. If the `maximumPopulateLimit` is nowhere set we use the `maximumLimit`. Defaults to `maximumLimit`.
defaultSort | `string` | The default sort of records to show in the response from a `find` or a `findOne` action. Pass the name(s) of (an) attribute(s) to get an individual sorting of the records. The default direction for each sort attribute is ascending, use a `-` before the attribute name for descending sort. Separate several sorts by a comma. Note: `id` matches automatically the primary key attribute. Have no fear to use unavailable attributes, they will be automatically ignored. You can override this default setting individually for each model. Just add `_config: { defaultSort: 'id' }` to your favorite model. Other models without an individual setting, use this default setting. Defaults to `id`.
parameterNameSort | `string` | The name of the sort parameter to receive a favorite sorting by an user. Defaults to `sort`.
defaultFields | `string|boolean` | The default fields of records to show in the response from a `find` or a `findOne` action. Pass the name(s) of (an) attribute(s) to get an individual set of the returned record fields. Use a `-` at the beginning to exclude the fields from the records. Separate your favorite fields by a comma or use `false` to return all available fields. Note: `id` matches automatically the primary key attribute. Have no fear to use unavailable fields, they will be automatically ignored. You can override this default setting individually for each model. Just add `_config: { defaultFields: false }` to your favorite model. Other models without an individual setting, use this default setting. Defaults to `false`.
parameterNameFields | `string` | The name of the fields parameter to receive a favorite choice of the returned fields by an user. Defaults to `fields`.

## License

[MIT License](https://mit-license.org/)

![image_squidhome@2x.png](http://sailsjs.org/images/bkgd_squiddy.png)