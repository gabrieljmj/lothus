'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Polifyll for Object.assign
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function value(target) {
      'use strict';

      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

function routeHasParameters(route) {
  var parts = route.split('/'),
      has = false;

  parts.forEach(function (part) {
    if (part.substr(0, 1) === ':') has = true;
  });

  return has;
}

function changePageTitle(newTitle, doc) {
  doc = doc || document;

  doc.title = newTitle || doc.title;
}

var Lothus = function () {
  function Lothus(doc) {
    _classCallCheck(this, Lothus);

    this.events = {};
    this.dataBinder = rivets;
    this.router = new Navigo(null, false);

    this._document = doc || document;

    this._providers = {};
    this._originalProviders = {};

    this._routes = {};
    this._lastRoute;
    this._lastProvider;
    this._defaultRoute;
  }

  /**
   * Initializes the application
   *
   * @return {Promise}
   */


  _createClass(Lothus, [{
    key: 'init',
    value: function init() {
      var _this = this;

      return new Promise(function (resolve) {
        // Searches for all pages using 'name' and 'route' attributes
        var pages = _this._document.querySelectorAll('page[name][route]'),

        // Search all pages using 'default' attribute
        home = _this._document.querySelectorAll('page[name][route][default]'),
            defaultRoute = void 0,
            routes = {};

        // Check if more than one page or none are using 'default' attribute
        if (!!!home.length || home.length > 1) {
          throw new Error('An unique default page is necessary. ' + home.length + ' indicated');
        }

        home = home[0];

        pages.forEach(function (page) {
          // Generate page options
          var opts = _this._getOptions(page),
              regexRoute = page.attributes.regexRoute;

          _this._routes[opts.name] = opts;

          var name = page.attributes.name.value,
              route = page.attributes.route.value;

          // Creates a route following navigo standard
          routes[route] = {
            as: name,
            uses: function uses(params) {
              var self = _this;

              params = params || {};

              // Check if page has a data provider
              // Data provider will be used to pass URL parameters through the page
              if (opts.dataProvider) {
                if (!_this._providers[opts.dataProvider]) {
                  _this._providers[opts.dataProvider] = {};
                }

                _this.provider(opts.dataProvider, { _params: params });
              } else {
                // Creates a generic data provider for page
                var providerName = '__for_' + name;

                _this.provider(providerName, { _params: params });

                opts.dataProvider = providerName;
              }

              _this._handleRoute(opts).then(function (route) {
                // Updates the page title
                changePageTitle(route.title, self._document);

                // Hides all other pages
                self._document.querySelectorAll('page[name][route]').forEach(function (page) {
                  page.style.display = page.attributes.name.value !== route.name ? 'none' : '';
                });
              });
            }
          };

          if (page === home) {
            if (routeHasParameters(route)) {
              throw new Error('Default route must not have parameters.');
            }

            _this._defaultRoute = name;
          }
        });

        // Register routes on Navigo
        _this.router.on(routes);

        _this._applyEvents();

        _this._initRouter();

        resolve();
      });
    }

    /**
     * Sets data of a provider and update the page with the new data
     *
     * @param {String} name
     * @param {Object} value
     */

  }, {
    key: 'provider',
    value: function provider(name, data) {
      if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
        throw new Error('Data providers can only be objects');
      }

      if (!this._providers[name]) {
        this._providers[name] = {};
      }

      var newData = Object.assign(this._providers[name], data);

      if (!this._originalProviders[name]) {
        this._originalProviders[name] = {};

        for (var k in newData) {
          if (newData.hasOwnProperty(k)) {
            this._originalProviders[name][k] = newData[k];
          }
        }
      }

      this._providers[name] = newData;
    }

    /**
     * Applies events
     */

  }, {
    key: '_applyEvents',
    value: function _applyEvents() {
      var self = this;

      // On page changing
      window.onhashchange = function () {
        // Saves page on history
        if (window.history.pushState) {
          window.history.pushState(null, null, window.location.href);
        }

        self._initRouter();
      };
    }
  }, {
    key: '_initRouter',
    value: function _initRouter() {
      this.router.resolve();

      // Check if no route is beein used, so render the one defined as default (index)
      if (window.location.hash === '' || window.location.hash === '#') {
        this._renderDefaultRoute();
      }
    }

    /**
     * Redners the default (index) route
     */

  }, {
    key: '_renderDefaultRoute',
    value: function _renderDefaultRoute() {
      window.location.hash = '#' + this._routes[this._defaultRoute].route;
      //this._handleRoute(this._routes[this._defaultRoute]);
    }

    /**
     * Data binding for certain route
     *
     * @param {Object} route
     */

  }, {
    key: '_render',
    value: function _render(route) {
      if (route && route.dataProvider) {
        var data = this._providers[route.dataProvider];
        this._lastProvider = route.dataProvider;

        this.dataBinder.bind(this._document.querySelector('page[name="' + route.name + '"]'), data);
      }
    }

    /**
     * Returns options of a page
     *
     * @param {Object} route
     *
     * @return {Object}
     */

  }, {
    key: '_getOptions',
    value: function _getOptions(route) {
      var opts = { name: route.attributes.name.value, route: route.attributes.route.value, clone: route.cloneNode(true) };

      if (route.attributes['data-provider']) {
        opts.dataProvider = route.attributes['data-provider'].value;
      }

      if (route.attributes.origin) {
        opts.origin = route.attributes.origin.value;
      }

      if (route.attributes.title) {
        opts.title = route.attributes.title.value;
      }

      if (route.attributes.onload) {
        if (!this.events[route.attributes.onload.value]) {
          throw new Error('Event for ' + route.attributes.route.value + '::onload not found: ' + route.attributes.onload.value);
        }

        opts.onload = route.attributes.onload.value;
      }

      if (route.attributes.onunload) {
        if (!this.events[route.attributes.onunload.value]) {
          throw new Error('Event for ' + route.attributes.route.value + '::onunload not found: ' + route.attributes.onunload.value);
        }

        opts.onunload = route.attributes.onunload.value;
      }

      return opts;
    }
  }, {
    key: '_handleRoute',
    value: function _handleRoute(opts) {
      var _this2 = this;

      return new Promise(function (resolve) {
        var route = opts,
            location = window.location.href;

        _this2._handleEvent(route).onunload();

        // Verifies if page has an external origin
        if (route.origin) {
          (function () {
            var self = _this2;

            // Imports the external page
            importTemplate(route.origin).then(function (content) {
              self._document.querySelector('page[name="' + route.name + '"]').innerHTML = content.body.innerHTML;
              self._render(route);

              self._handleEvent(route).onload();
            });
          })();
        } else {
          _this2._render(route);

          _this2._handleEvent(route).onload();
        }

        resolve(route);
      });
    }
  }, {
    key: '_handleEvent',
    value: function _handleEvent(route) {
      var self = this,
          currentPageElement = this._document.querySelector('page[name="' + route.name + '"]');

      return {
        onload: function handleOnloadEvent() {
          if (route.onload) {
            self.events[route.onload].bind(currentPageElement, self._providers[route.dataProvider]._params).call();
          }
        },
        onunload: function handleOnunloadEvent() {
          if (self._lastRoute) {
            if (self._routes[self._lastRoute].onunload) {
              self.events[self._routes[self._lastRoute].onunload].call();
            }

            var lastRoute = self._routes[self._lastRoute];

            // Sets the last accessed page to original state
            self._document.querySelector('page[name="' + lastRoute.name + '"]').innerHTML = lastRoute.clone.innerHTML;
          }

          // Get back to original data from provider
          if (self._lastProvider) {
            self._providers[self._lastProvider] = self._originalProviders[self._lastProvider];
          }

          self._lastRoute = route.name;
        }
      };
    }
  }]);

  return Lothus;
}();

if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object') {
  module.exports = Lothus;
} else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
  exports.Lothus = Lothus;
}
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Navigo", [], factory);
	else if(typeof exports === 'object')
		exports["Navigo"] = factory();
	else
		root["Navigo"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	var PARAMETER_REGEXP = /([:*])(\w+)/g;
	var WILDCARD_REGEXP = /\*/g;
	var REPLACE_VARIABLE_REGEXP = '([^\/]+)';
	var REPLACE_WILDCARD = '(?:.*)';
	var FOLLOWED_BY_SLASH_REGEXP = '(?:\/|$)';
	
	function clean(s) {
	  if (s instanceof RegExp) return s;
	  return s.replace(/\/+$/, '').replace(/^\/+/, '/');
	}
	
	function regExpResultToParams(match, names) {
	  if (names.length === 0) return null;
	  if (!match) return null;
	  return match.slice(1, match.length).reduce(function (params, value, index) {
	    if (params === null) params = {};
	    params[names[index]] = value;
	    return params;
	  }, null);
	}
	
	function replaceDynamicURLParts(route) {
	  var paramNames = [],
	      regexp;
	
	  if (route instanceof RegExp) {
	    regexp = route;
	  } else {
	    regexp = new RegExp(clean(route).replace(PARAMETER_REGEXP, function (full, dots, name) {
	      paramNames.push(name);
	      return REPLACE_VARIABLE_REGEXP;
	    }).replace(WILDCARD_REGEXP, REPLACE_WILDCARD) + FOLLOWED_BY_SLASH_REGEXP);
	  }
	  return { regexp: regexp, paramNames: paramNames };
	}
	
	function findMatchedRoutes(url) {
	  var routes = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
	
	  return routes.map(function (route) {
	    var _replaceDynamicURLPar = replaceDynamicURLParts(route.route);
	
	    var regexp = _replaceDynamicURLPar.regexp;
	    var paramNames = _replaceDynamicURLPar.paramNames;
	
	    var match = url.match(regexp);
	    var params = regExpResultToParams(match, paramNames);
	
	    return match ? { match: match, route: route, params: params } : false;
	  }).filter(function (m) {
	    return m;
	  });
	}
	
	function match(url, routes) {
	  return findMatchedRoutes(url, routes)[0] || false;
	}
	
	function root(url, routes) {
	  var matched = findMatchedRoutes(url, routes.filter(function (route) {
	    var u = clean(route.route);
	
	    return u !== '' && u !== '*';
	  }));
	  var fallbackURL = clean(url);
	
	  if (matched.length > 0) {
	    return matched.map(function (m) {
	      return clean(url.substr(0, m.match.index));
	    }).reduce(function (root, current) {
	      return current.length < root.length ? current : root;
	    }, fallbackURL);
	  }
	  return fallbackURL;
	}
	
	function isPushStateAvailable() {
	  return !!(typeof window !== 'undefined' && window.history && window.history.pushState);
	}
	
	function Navigo(r, useHash) {
	  this._routes = [];
	  this.root = useHash && r ? r.replace(/\/$/, '/#') : r || null;
	  this._useHash = useHash;
	  this._paused = false;
	  this._destroyed = false;
	  this._lastRouteResolved = null;
	  this._ok = !useHash && isPushStateAvailable();
	  this._listen();
	  this.updatePageLinks();
	}
	
	Navigo.prototype = {
	  helpers: {
	    match: match,
	    root: root,
	    clean: clean
	  },
	  navigate: function navigate(path, absolute) {
	    var to;
	
	    path = path || '';
	    if (this._ok) {
	      to = (!absolute ? this._getRoot() + '/' : '') + clean(path);
	      to = to.replace(/([^:])(\/{2,})/g, '$1/');
	      history[this._paused ? 'replaceState' : 'pushState']({}, '', to);
	      this.resolve();
	    } else if (typeof window !== 'undefined') {
	      window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
	    }
	    return this;
	  },
	  on: function on() {
	    if (arguments.length >= 2) {
	      this._add(arguments.length <= 0 ? undefined : arguments[0], arguments.length <= 1 ? undefined : arguments[1]);
	    } else if (_typeof(arguments.length <= 0 ? undefined : arguments[0]) === 'object') {
	      for (var route in arguments.length <= 0 ? undefined : arguments[0]) {
	        this._add(route, (arguments.length <= 0 ? undefined : arguments[0])[route]);
	      }
	    } else if (typeof (arguments.length <= 0 ? undefined : arguments[0]) === 'function') {
	      this._add('', arguments.length <= 0 ? undefined : arguments[0]);
	    }
	    return this;
	  },
	  resolve: function resolve(current) {
	    var handler, m;
	    var url = (current || this._cLoc()).replace(this._getRoot(), '');
	
	    if (this._paused || url === this._lastRouteResolved) return false;
	    if (this._useHash) {
	      url = url.replace(/^\/#/, '/');
	    }
	    m = match(url, this._routes);

	    if (m) {
	      this._lastRouteResolved = url;
	      handler = m.route.handler;
	      m.route.route instanceof RegExp ? handler.apply(undefined, _toConsumableArray(m.match.slice(1, m.match.length))) : handler(m.params);
	      return m;
	    }
	    return false;
	  },
	  destroy: function destroy() {
	    this._routes = [];
	    this._destroyed = true;
	    clearTimeout(this._listenningInterval);
	    typeof window !== 'undefined' ? window.onpopstate = null : null;
	  },
	  updatePageLinks: function updatePageLinks() {
	    var self = this;
	
	    if (typeof document === 'undefined') return;
	
	    this._findLinks().forEach(function (link) {
	      if (!link.hasListenerAttached) {
	        link.addEventListener('click', function (e) {
	          var location = link.getAttribute('href');
	
	         
	          if (!self._destroyed) {
	            e.preventDefault();
	            self.navigate(clean(location));
	          }
	        });
	         link.hasListenerAttached = true;
	      }
	    });
	  },
	  generate: function generate(name) {
	    var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	    return this._routes.reduce(function (result, route) {
	      var key;
	
	      if (route.name === name) {
	        result = route.route;
	        for (key in data) {
	          result = result.replace(':' + key, data[key]);
	        }
	      }
	      return result;
	    }, '');
	  },
	  link: function link(path) {
	    return this._getRoot() + path;
	  },
	  pause: function pause(status) {
	    this._paused = status;
	  },
	  disableIfAPINotAvailable: function disableIfAPINotAvailable() {
	    if (!isPushStateAvailable()) {
	      this.destroy();
	    }
	  },
	  _add: function _add(route) {
	    var handler = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
	
	    if ((typeof handler === 'undefined' ? 'undefined' : _typeof(handler)) === 'object') {
	      this._routes.push({ route: route, handler: handler.uses, name: handler.as });
	    } else {
	      this._routes.push({ route: route, handler: handler });
	    }
	    return this._add;
	  },
	  _getRoot: function _getRoot() {
	    if (this.root !== null) return this.root;
	    this.root = root(this._cLoc(), this._routes);
	    return this.root;
	  },
	  _listen: function _listen() {
	    var _this = this;
	
	    if (this._ok) {
	      window.onpopstate = function () {
	        _this.resolve();
	      };
	    } else {
	      (function () {
	        var cached = _this._cLoc(),
	            current = undefined,
	            _check = undefined;
	
	        _check = function check() {
	          current = _this._cLoc();
	          if (cached !== current) {
	            cached = current;
	            _this.resolve();
	          }
	          _this._listenningInterval = setTimeout(_check, 200);
	        };
	        _check();
	      })();
	    }
	  },
	  _cLoc: function _cLoc() {
	    if (typeof window !== 'undefined') {
	      return window.location.href;
	    }
	    return '';
	  },
	  _findLinks: function _findLinks() {
	    return [].slice.call(document.querySelectorAll('[data-navigo]'));
	  }
	};
	
	exports.default = Navigo;
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
//# sourceMappingURL=navigo.js.map

if (typeof exports === 'undefined') {
  var exports = {};
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
  * @author Gabriel Jacinto aka. GabrielJMJ <gamjj74@hotmail.com>
  * @license MIT License
 */

var importTemplate = function importTemplate(path) {
  return new Promise(function (resolve, reject) {
    var link = document.createElement('link');

    link.setAttribute('href', path);
    link.setAttribute('rel', 'import');
    link.onload = function (e) {
      resolve(this.import);
    };
    link.onerror = function (e) {
      reject(reject(e));
    };

    document.head.appendChild(link);
  });
};

exports.importTemplate = importTemplate;
// Rivets.js + Sightglass.js
// version: 0.9.1
// author: Michael Richards
// license: MIT
(function(){function t(t,i,s,h){return new e(t,i,s,h)}function e(t,e,s,h){this.options=h||{},this.options.adapters=this.options.adapters||{},this.obj=t,this.keypath=e,this.callback=s,this.objectPath=[],this.parse(),i(this.target=this.realize())&&this.set(!0,this.key,this.target,this.callback)}function i(t){return"object"==typeof t&&null!==t}function s(t){throw new Error("[sightglass] "+t)}t.adapters={},e.tokenize=function(t,e,i){var s,h,a=[],o={i:i,path:""};for(s=0;s<t.length;s++)h=t.charAt(s),~e.indexOf(h)?(a.push(o),o={i:h,path:""}):o.path+=h;return a.push(o),a},e.prototype.parse=function(){var i,h,a=this.interfaces();a.length||s("Must define at least one adapter interface."),~a.indexOf(this.keypath[0])?(i=this.keypath[0],h=this.keypath.substr(1)):("undefined"==typeof(i=this.options.root||t.root)&&s("Must define a default root adapter."),h=this.keypath),this.tokens=e.tokenize(h,a,i),this.key=this.tokens.pop()},e.prototype.realize=function(){var t,e=this.obj,s=!1;return this.tokens.forEach(function(h,a){i(e)?("undefined"!=typeof this.objectPath[a]?e!==(t=this.objectPath[a])&&(this.set(!1,h,t,this.update.bind(this)),this.set(!0,h,e,this.update.bind(this)),this.objectPath[a]=e):(this.set(!0,h,e,this.update.bind(this)),this.objectPath[a]=e),e=this.get(h,e)):(s===!1&&(s=a),(t=this.objectPath[a])&&this.set(!1,h,t,this.update.bind(this)))},this),s!==!1&&this.objectPath.splice(s),e},e.prototype.update=function(){var t,e;(t=this.realize())!==this.target&&(i(this.target)&&this.set(!1,this.key,this.target,this.callback),i(t)&&this.set(!0,this.key,t,this.callback),e=this.value(),this.target=t,this.value()!==e&&this.callback())},e.prototype.value=function(){return i(this.target)?this.get(this.key,this.target):void 0},e.prototype.setValue=function(t){i(this.target)&&this.adapter(this.key).set(this.target,this.key.path,t)},e.prototype.get=function(t,e){return this.adapter(t).get(e,t.path)},e.prototype.set=function(t,e,i,s){var h=t?"observe":"unobserve";this.adapter(e)[h](i,e.path,s)},e.prototype.interfaces=function(){var e=Object.keys(this.options.adapters);return Object.keys(t.adapters).forEach(function(t){~e.indexOf(t)||e.push(t)}),e},e.prototype.adapter=function(e){return this.options.adapters[e.i]||t.adapters[e.i]},e.prototype.unobserve=function(){var t;this.tokens.forEach(function(e,i){(t=this.objectPath[i])&&this.set(!1,e,t,this.update.bind(this))},this),i(this.target)&&this.set(!1,this.key,this.target,this.callback)},"undefined"!=typeof module&&module.exports?module.exports=t:"function"==typeof define&&define.amd?define([],function(){return this.sightglass=t}):this.sightglass=t}).call(this);
(function(){var t,e,i,n,s=function(t,e){return function(){return t.apply(e,arguments)}},r=[].slice,o={}.hasOwnProperty,u=function(t,e){function i(){this.constructor=t}for(var n in e)o.call(e,n)&&(t[n]=e[n]);return i.prototype=e.prototype,t.prototype=new i,t.__super__=e.prototype,t},l=[].indexOf||function(t){for(var e=0,i=this.length;i>e;e++)if(e in this&&this[e]===t)return e;return-1};t={options:["prefix","templateDelimiters","rootInterface","preloadData","handler","executeFunctions"],extensions:["binders","formatters","components","adapters"],"public":{binders:{},components:{},formatters:{},adapters:{},prefix:"rv",templateDelimiters:["{","}"],rootInterface:".",preloadData:!0,executeFunctions:!1,iterationAlias:function(t){return"%"+t+"%"},handler:function(t,e,i){return this.call(t,e,i.view.models)},configure:function(e){var i,n,s,r;null==e&&(e={});for(s in e)if(r=e[s],"binders"===s||"components"===s||"formatters"===s||"adapters"===s)for(n in r)i=r[n],t[s][n]=i;else t["public"][s]=r},bind:function(e,i,n){var s;return null==i&&(i={}),null==n&&(n={}),s=new t.View(e,i,n),s.bind(),s},init:function(e,i,n){var s,r,o;if(null==n&&(n={}),null==i&&(i=document.createElement("div")),e=t["public"].components[e],r=e.template.call(this,i),r instanceof HTMLElement){for(;i.firstChild;)i.removeChild(i.firstChild);i.appendChild(r)}else i.innerHTML=r;return s=e.initialize.call(this,i,n),o=new t.View(i,s),o.bind(),o}}},window.jQuery||window.$?(n="on"in jQuery.prototype?["on","off"]:["bind","unbind"],e=n[0],i=n[1],t.Util={bindEvent:function(t,i,n){return jQuery(t)[e](i,n)},unbindEvent:function(t,e,n){return jQuery(t)[i](e,n)},getInputValue:function(t){var e;return e=jQuery(t),"checkbox"===e.attr("type")?e.is(":checked"):e.val()}}):t.Util={bindEvent:function(){return"addEventListener"in window?function(t,e,i){return t.addEventListener(e,i,!1)}:function(t,e,i){return t.attachEvent("on"+e,i)}}(),unbindEvent:function(){return"removeEventListener"in window?function(t,e,i){return t.removeEventListener(e,i,!1)}:function(t,e,i){return t.detachEvent("on"+e,i)}}(),getInputValue:function(t){var e,i,n,s;if("checkbox"===t.type)return t.checked;if("select-multiple"===t.type){for(s=[],i=0,n=t.length;n>i;i++)e=t[i],e.selected&&s.push(e.value);return s}return t.value}},t.TypeParser=function(){function t(){}return t.types={primitive:0,keypath:1},t.parse=function(t){return/^'.*'$|^".*"$/.test(t)?{type:this.types.primitive,value:t.slice(1,-1)}:"true"===t?{type:this.types.primitive,value:!0}:"false"===t?{type:this.types.primitive,value:!1}:"null"===t?{type:this.types.primitive,value:null}:"undefined"===t?{type:this.types.primitive,value:void 0}:""===t?{type:this.types.primitive,value:void 0}:isNaN(Number(t))===!1?{type:this.types.primitive,value:Number(t)}:{type:this.types.keypath,value:t}},t}(),t.TextTemplateParser=function(){function t(){}return t.types={text:0,binding:1},t.parse=function(t,e){var i,n,s,r,o,u,l;for(u=[],r=t.length,i=0,n=0;r>n;){if(i=t.indexOf(e[0],n),0>i){u.push({type:this.types.text,value:t.slice(n)});break}if(i>0&&i>n&&u.push({type:this.types.text,value:t.slice(n,i)}),n=i+e[0].length,i=t.indexOf(e[1],n),0>i){o=t.slice(n-e[1].length),s=u[u.length-1],(null!=s?s.type:void 0)===this.types.text?s.value+=o:u.push({type:this.types.text,value:o});break}l=t.slice(n,i).trim(),u.push({type:this.types.binding,value:l}),n=i+e[1].length}return u},t}(),t.View=function(){function e(e,i,n){var r,o,u,l,h,a,p,d,c,f,b,v,y;for(this.els=e,this.models=i,null==n&&(n={}),this.update=s(this.update,this),this.publish=s(this.publish,this),this.sync=s(this.sync,this),this.unbind=s(this.unbind,this),this.bind=s(this.bind,this),this.select=s(this.select,this),this.traverse=s(this.traverse,this),this.build=s(this.build,this),this.buildBinding=s(this.buildBinding,this),this.bindingRegExp=s(this.bindingRegExp,this),this.options=s(this.options,this),this.els.jquery||this.els instanceof Array||(this.els=[this.els]),c=t.extensions,h=0,p=c.length;p>h;h++){if(o=c[h],this[o]={},n[o]){f=n[o];for(r in f)u=f[r],this[o][r]=u}b=t["public"][o];for(r in b)u=b[r],null==(l=this[o])[r]&&(l[r]=u)}for(v=t.options,a=0,d=v.length;d>a;a++)o=v[a],this[o]=null!=(y=n[o])?y:t["public"][o];this.build()}return e.prototype.options=function(){var e,i,n,s,r;for(i={},r=t.extensions.concat(t.options),n=0,s=r.length;s>n;n++)e=r[n],i[e]=this[e];return i},e.prototype.bindingRegExp=function(){return new RegExp("^"+this.prefix+"-")},e.prototype.buildBinding=function(e,i,n,s){var r,o,u,l,h,a,p;return h={},p=function(){var t,e,i,n;for(i=s.match(/((?:'[^']*')*(?:(?:[^\|']*(?:'[^']*')+[^\|']*)+|[^\|]+))|^$/g),n=[],t=0,e=i.length;e>t;t++)a=i[t],n.push(a.trim());return n}(),r=function(){var t,e,i,n;for(i=p.shift().split("<"),n=[],t=0,e=i.length;e>t;t++)o=i[t],n.push(o.trim());return n}(),l=r.shift(),h.formatters=p,(u=r.shift())&&(h.dependencies=u.split(/\s+/)),this.bindings.push(new t[e](this,i,n,l,h))},e.prototype.build=function(){var e,i,n,s,r;for(this.bindings=[],i=function(e){return function(n){var s,r,o,u,l,h,a,p,d,c,f,b,v;if(3===n.nodeType){if(l=t.TextTemplateParser,(o=e.templateDelimiters)&&(p=l.parse(n.data,o)).length&&(1!==p.length||p[0].type!==l.types.text)){for(d=0,f=p.length;f>d;d++)a=p[d],h=document.createTextNode(a.value),n.parentNode.insertBefore(h,n),1===a.type&&e.buildBinding("TextBinding",h,null,a.value);n.parentNode.removeChild(n)}}else 1===n.nodeType&&(s=e.traverse(n));if(!s)for(v=function(){var t,e,i,s;for(i=n.childNodes,s=[],t=0,e=i.length;e>t;t++)u=i[t],s.push(u);return s}(),c=0,b=v.length;b>c;c++)r=v[c],i(r)}}(this),r=this.els,n=0,s=r.length;s>n;n++)e=r[n],i(e);this.bindings.sort(function(t,e){var i,n;return((null!=(i=e.binder)?i.priority:void 0)||0)-((null!=(n=t.binder)?n.priority:void 0)||0)})},e.prototype.traverse=function(e){var i,n,s,r,o,u,l,h,a,p,d,c,f,b,v,y;for(r=this.bindingRegExp(),o="SCRIPT"===e.nodeName||"STYLE"===e.nodeName,b=e.attributes,p=0,c=b.length;c>p;p++)if(i=b[p],r.test(i.name)){if(h=i.name.replace(r,""),!(s=this.binders[h])){v=this.binders;for(u in v)a=v[u],"*"!==u&&-1!==u.indexOf("*")&&(l=new RegExp("^"+u.replace(/\*/g,".+")+"$"),l.test(h)&&(s=a))}s||(s=this.binders["*"]),s.block&&(o=!0,n=[i])}for(y=n||e.attributes,d=0,f=y.length;f>d;d++)i=y[d],r.test(i.name)&&(h=i.name.replace(r,""),this.buildBinding("Binding",e,h,i.value));return o||(h=e.nodeName.toLowerCase(),this.components[h]&&!e._bound&&(this.bindings.push(new t.ComponentBinding(this,e,h)),o=!0)),o},e.prototype.select=function(t){var e,i,n,s,r;for(s=this.bindings,r=[],i=0,n=s.length;n>i;i++)e=s[i],t(e)&&r.push(e);return r},e.prototype.bind=function(){var t,e,i,n;for(n=this.bindings,e=0,i=n.length;i>e;e++)t=n[e],t.bind()},e.prototype.unbind=function(){var t,e,i,n;for(n=this.bindings,e=0,i=n.length;i>e;e++)t=n[e],t.unbind()},e.prototype.sync=function(){var t,e,i,n;for(n=this.bindings,e=0,i=n.length;i>e;e++)t=n[e],"function"==typeof t.sync&&t.sync()},e.prototype.publish=function(){var t,e,i,n;for(n=this.select(function(t){var e;return null!=(e=t.binder)?e.publishes:void 0}),e=0,i=n.length;i>e;e++)t=n[e],t.publish()},e.prototype.update=function(t){var e,i,n,s,r,o;null==t&&(t={});for(i in t)n=t[i],this.models[i]=n;for(o=this.bindings,s=0,r=o.length;r>s;s++)e=o[s],"function"==typeof e.update&&e.update(t)},e}(),t.Binding=function(){function e(t,e,i,n,r){this.view=t,this.el=e,this.type=i,this.keypath=n,this.options=null!=r?r:{},this.getValue=s(this.getValue,this),this.update=s(this.update,this),this.unbind=s(this.unbind,this),this.bind=s(this.bind,this),this.publish=s(this.publish,this),this.sync=s(this.sync,this),this.set=s(this.set,this),this.eventHandler=s(this.eventHandler,this),this.formattedValue=s(this.formattedValue,this),this.parseTarget=s(this.parseTarget,this),this.observe=s(this.observe,this),this.setBinder=s(this.setBinder,this),this.formatters=this.options.formatters||[],this.dependencies=[],this.formatterObservers={},this.model=void 0,this.setBinder()}return e.prototype.setBinder=function(){var t,e,i,n;if(!(this.binder=this.view.binders[this.type])){n=this.view.binders;for(t in n)i=n[t],"*"!==t&&-1!==t.indexOf("*")&&(e=new RegExp("^"+t.replace(/\*/g,".+")+"$"),e.test(this.type)&&(this.binder=i,this.args=new RegExp("^"+t.replace(/\*/g,"(.+)")+"$").exec(this.type),this.args.shift()))}return this.binder||(this.binder=this.view.binders["*"]),this.binder instanceof Function?this.binder={routine:this.binder}:void 0},e.prototype.observe=function(e,i,n){return t.sightglass(e,i,n,{root:this.view.rootInterface,adapters:this.view.adapters})},e.prototype.parseTarget=function(){var e;return e=t.TypeParser.parse(this.keypath),0===e.type?this.value=e.value:(this.observer=this.observe(this.view.models,this.keypath,this.sync),this.model=this.observer.target)},e.prototype.formattedValue=function(e){var i,n,s,o,u,l,h,a,p,d,c,f,b,v,y;for(v=this.formatters,o=d=0,f=v.length;f>d;o=++d){for(u=v[o],s=u.match(/[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g),l=s.shift(),u=this.view.formatters[l],s=function(){var e,i,r;for(r=[],e=0,i=s.length;i>e;e++)n=s[e],r.push(t.TypeParser.parse(n));return r}(),a=[],i=c=0,b=s.length;b>c;i=++c)n=s[i],a.push(0===n.type?n.value:((p=this.formatterObservers)[o]||(p[o]={}),(h=this.formatterObservers[o][i])?void 0:(h=this.observe(this.view.models,n.value,this.sync),this.formatterObservers[o][i]=h),h.value()));(null!=u?u.read:void 0)instanceof Function?e=(y=u.read).call.apply(y,[this.model,e].concat(r.call(a))):u instanceof Function&&(e=u.call.apply(u,[this.model,e].concat(r.call(a))))}return e},e.prototype.eventHandler=function(t){var e,i;return i=(e=this).view.handler,function(n){return i.call(t,this,n,e)}},e.prototype.set=function(e){var i;return e=e instanceof Function&&!this.binder["function"]&&t["public"].executeFunctions?this.formattedValue(e.call(this.model)):this.formattedValue(e),null!=(i=this.binder.routine)?i.call(this,this.el,e):void 0},e.prototype.sync=function(){var t,e;return this.set(function(){var i,n,s,r,o,u,l;if(this.observer){if(this.model!==this.observer.target){for(o=this.dependencies,i=0,s=o.length;s>i;i++)e=o[i],e.unobserve();if(this.dependencies=[],null!=(this.model=this.observer.target)&&(null!=(u=this.options.dependencies)?u.length:void 0))for(l=this.options.dependencies,n=0,r=l.length;r>n;n++)t=l[n],e=this.observe(this.model,t,this.sync),this.dependencies.push(e)}return this.observer.value()}return this.value}.call(this))},e.prototype.publish=function(){var t,e,i,n,s,o,u,l,h;if(this.observer){for(n=this.getValue(this.el),u=this.formatters.slice(0).reverse(),s=0,o=u.length;o>s;s++)e=u[s],t=e.split(/\s+/),i=t.shift(),(null!=(l=this.view.formatters[i])?l.publish:void 0)&&(n=(h=this.view.formatters[i]).publish.apply(h,[n].concat(r.call(t))));return this.observer.setValue(n)}},e.prototype.bind=function(){var t,e,i,n,s,r,o;if(this.parseTarget(),null!=(s=this.binder.bind)&&s.call(this,this.el),null!=this.model&&(null!=(r=this.options.dependencies)?r.length:void 0))for(o=this.options.dependencies,i=0,n=o.length;n>i;i++)t=o[i],e=this.observe(this.model,t,this.sync),this.dependencies.push(e);return this.view.preloadData?this.sync():void 0},e.prototype.unbind=function(){var t,e,i,n,s,r,o,u,l,h;for(null!=(o=this.binder.unbind)&&o.call(this,this.el),null!=(u=this.observer)&&u.unobserve(),l=this.dependencies,s=0,r=l.length;r>s;s++)n=l[s],n.unobserve();this.dependencies=[],h=this.formatterObservers;for(i in h){e=h[i];for(t in e)n=e[t],n.unobserve()}return this.formatterObservers={}},e.prototype.update=function(t){var e,i;return null==t&&(t={}),this.model=null!=(e=this.observer)?e.target:void 0,null!=(i=this.binder.update)?i.call(this,t):void 0},e.prototype.getValue=function(e){return this.binder&&null!=this.binder.getValue?this.binder.getValue.call(this,e):t.Util.getInputValue(e)},e}(),t.ComponentBinding=function(e){function i(e,i,n){var r,o,u,h,a,p,d,c;for(this.view=e,this.el=i,this.type=n,this.unbind=s(this.unbind,this),this.bind=s(this.bind,this),this.locals=s(this.locals,this),this.component=this.view.components[this.type],this["static"]={},this.observers={},this.upstreamObservers={},o=e.bindingRegExp(),d=this.el.attributes||[],a=0,p=d.length;p>a;a++)r=d[a],o.test(r.name)||(u=this.camelCase(r.name),h=t.TypeParser.parse(r.value),l.call(null!=(c=this.component["static"])?c:[],u)>=0?this["static"][u]=r.value:0===h.type?this["static"][u]=h.value:this.observers[u]=r.value)}return u(i,e),i.prototype.sync=function(){},i.prototype.update=function(){},i.prototype.publish=function(){},i.prototype.locals=function(){var t,e,i,n,s,r;i={},s=this["static"];for(t in s)n=s[t],i[t]=n;r=this.observers;for(t in r)e=r[t],i[t]=e.value();return i},i.prototype.camelCase=function(t){return t.replace(/-([a-z])/g,function(t){return t[1].toUpperCase()})},i.prototype.bind=function(){var e,i,n,s,r,o,u,l,h,a,p,d,c,f,b,v,y,m,g,w;if(!this.bound){f=this.observers;for(i in f)n=f[i],this.observers[i]=this.observe(this.view.models,n,function(t){return function(e){return function(){return t.componentView.models[e]=t.observers[e].value()}}}(this).call(this,i));this.bound=!0}if(null!=this.componentView)this.componentView.bind();else{for(this.el.innerHTML=this.component.template.call(this),u=this.component.initialize.call(this,this.el,this.locals()),this.el._bound=!0,o={},b=t.extensions,a=0,d=b.length;d>a;a++){if(r=b[a],o[r]={},this.component[r]){v=this.component[r];for(e in v)l=v[e],o[r][e]=l}y=this.view[r];for(e in y)l=y[e],null==(h=o[r])[e]&&(h[e]=l)}for(m=t.options,p=0,c=m.length;c>p;p++)r=m[p],o[r]=null!=(g=this.component[r])?g:this.view[r];this.componentView=new t.View(Array.prototype.slice.call(this.el.childNodes),u,o),this.componentView.bind(),w=this.observers;for(i in w)s=w[i],this.upstreamObservers[i]=this.observe(this.componentView.models,i,function(t){return function(e,i){return function(){return i.setValue(t.componentView.models[e])}}}(this).call(this,i,s))}},i.prototype.unbind=function(){var t,e,i,n,s;i=this.upstreamObservers;for(t in i)e=i[t],e.unobserve();n=this.observers;for(t in n)e=n[t],e.unobserve();return null!=(s=this.componentView)?s.unbind.call(this):void 0},i}(t.Binding),t.TextBinding=function(t){function e(t,e,i,n,r){this.view=t,this.el=e,this.type=i,this.keypath=n,this.options=null!=r?r:{},this.sync=s(this.sync,this),this.formatters=this.options.formatters||[],this.dependencies=[],this.formatterObservers={}}return u(e,t),e.prototype.binder={routine:function(t,e){return t.data=null!=e?e:""}},e.prototype.sync=function(){return e.__super__.sync.apply(this,arguments)},e}(t.Binding),t["public"].binders.text=function(t,e){return null!=t.textContent?t.textContent=null!=e?e:"":t.innerText=null!=e?e:""},t["public"].binders.html=function(t,e){return t.innerHTML=null!=e?e:""},t["public"].binders.show=function(t,e){return t.style.display=e?"":"none"},t["public"].binders.hide=function(t,e){return t.style.display=e?"none":""},t["public"].binders.enabled=function(t,e){return t.disabled=!e},t["public"].binders.disabled=function(t,e){return t.disabled=!!e},t["public"].binders.checked={publishes:!0,priority:2e3,bind:function(e){return t.Util.bindEvent(e,"change",this.publish)},unbind:function(e){return t.Util.unbindEvent(e,"change",this.publish)},routine:function(t,e){var i;return t.checked="radio"===t.type?(null!=(i=t.value)?i.toString():void 0)===(null!=e?e.toString():void 0):!!e}},t["public"].binders.unchecked={publishes:!0,priority:2e3,bind:function(e){return t.Util.bindEvent(e,"change",this.publish)},unbind:function(e){return t.Util.unbindEvent(e,"change",this.publish)},routine:function(t,e){var i;return t.checked="radio"===t.type?(null!=(i=t.value)?i.toString():void 0)!==(null!=e?e.toString():void 0):!e}},t["public"].binders.value={publishes:!0,priority:3e3,bind:function(e){return"INPUT"!==e.tagName||"radio"!==e.type?(this.event="SELECT"===e.tagName?"change":"input",t.Util.bindEvent(e,this.event,this.publish)):void 0},unbind:function(e){return"INPUT"!==e.tagName||"radio"!==e.type?t.Util.unbindEvent(e,this.event,this.publish):void 0},routine:function(t,e){var i,n,s,r,o,u,h;if("INPUT"===t.tagName&&"radio"===t.type)return t.setAttribute("value",e);if(null!=window.jQuery){if(t=jQuery(t),(null!=e?e.toString():void 0)!==(null!=(r=t.val())?r.toString():void 0))return t.val(null!=e?e:"")}else if("select-multiple"===t.type){if(null!=e){for(h=[],n=0,s=t.length;s>n;n++)i=t[n],h.push(i.selected=(o=i.value,l.call(e,o)>=0));return h}}else if((null!=e?e.toString():void 0)!==(null!=(u=t.value)?u.toString():void 0))return t.value=null!=e?e:""}},t["public"].binders["if"]={block:!0,priority:4e3,bind:function(t){var e,i;return null==this.marker?(e=[this.view.prefix,this.type].join("-").replace("--","-"),i=t.getAttribute(e),this.marker=document.createComment(" rivets: "+this.type+" "+i+" "),this.bound=!1,t.removeAttribute(e),t.parentNode.insertBefore(this.marker,t),t.parentNode.removeChild(t)):void 0},unbind:function(){return this.nested?(this.nested.unbind(),this.bound=!1):void 0},routine:function(e,i){var n,s,r,o;if(!!i==!this.bound){if(i){r={},o=this.view.models;for(n in o)s=o[n],r[n]=s;return(this.nested||(this.nested=new t.View(e,r,this.view.options()))).bind(),this.marker.parentNode.insertBefore(e,this.marker.nextSibling),this.bound=!0}return e.parentNode.removeChild(e),this.nested.unbind(),this.bound=!1}},update:function(t){var e;return null!=(e=this.nested)?e.update(t):void 0}},t["public"].binders.unless={block:!0,priority:4e3,bind:function(e){return t["public"].binders["if"].bind.call(this,e)},unbind:function(){return t["public"].binders["if"].unbind.call(this)},routine:function(e,i){return t["public"].binders["if"].routine.call(this,e,!i)},update:function(e){return t["public"].binders["if"].update.call(this,e)}},t["public"].binders["on-*"]={"function":!0,priority:1e3,unbind:function(e){return this.handler?t.Util.unbindEvent(e,this.args[0],this.handler):void 0},routine:function(e,i){return this.handler&&t.Util.unbindEvent(e,this.args[0],this.handler),t.Util.bindEvent(e,this.args[0],this.handler=this.eventHandler(i))}},t["public"].binders["each-*"]={block:!0,priority:4e3,bind:function(t){var e,i,n,s,r;if(null==this.marker)e=[this.view.prefix,this.type].join("-").replace("--","-"),this.marker=document.createComment(" rivets: "+this.type+" "),this.iterated=[],t.removeAttribute(e),t.parentNode.insertBefore(this.marker,t),t.parentNode.removeChild(t);else for(r=this.iterated,n=0,s=r.length;s>n;n++)i=r[n],i.bind()},unbind:function(){var t,e,i,n;if(null!=this.iterated)for(n=this.iterated,e=0,i=n.length;i>e;e++)t=n[e],t.unbind()},routine:function(e,i){var n,s,r,o,u,l,h,a,p,d,c,f,b,v,y,m,g,w,k,x;if(h=this.args[0],i=i||[],this.iterated.length>i.length)for(w=Array(this.iterated.length-i.length),f=0,y=w.length;y>f;f++)r=w[f],c=this.iterated.pop(),c.unbind(),this.marker.parentNode.removeChild(c.els[0]);for(o=b=0,m=i.length;m>b;o=++b)if(l=i[o],s={index:o},s[t["public"].iterationAlias(h)]=o,s[h]=l,null==this.iterated[o]){k=this.view.models;for(u in k)l=k[u],null==s[u]&&(s[u]=l);p=this.iterated.length?this.iterated[this.iterated.length-1].els[0]:this.marker,a=this.view.options(),a.preloadData=!0,d=e.cloneNode(!0),c=new t.View(d,s,a),c.bind(),this.iterated.push(c),this.marker.parentNode.insertBefore(d,p.nextSibling)}else this.iterated[o].models[h]!==l&&this.iterated[o].update(s);if("OPTION"===e.nodeName)for(x=this.view.bindings,v=0,g=x.length;g>v;v++)n=x[v],n.el===this.marker.parentNode&&"value"===n.type&&n.sync()},update:function(t){var e,i,n,s,r,o,u;e={};for(i in t)n=t[i],i!==this.args[0]&&(e[i]=n);for(u=this.iterated,r=0,o=u.length;o>r;r++)s=u[r],s.update(e)}},t["public"].binders["class-*"]=function(t,e){var i;return i=" "+t.className+" ",!e==(-1!==i.indexOf(" "+this.args[0]+" "))?t.className=e?""+t.className+" "+this.args[0]:i.replace(" "+this.args[0]+" "," ").trim():void 0},t["public"].binders["*"]=function(t,e){return null!=e?t.setAttribute(this.type,e):t.removeAttribute(this.type)},t["public"].formatters.call=function(){var t,e;return e=arguments[0],t=2<=arguments.length?r.call(arguments,1):[],e.call.apply(e,[this].concat(r.call(t)))},t["public"].adapters["."]={id:"_rv",counter:0,weakmap:{},weakReference:function(t){var e,i,n;return t.hasOwnProperty(this.id)||(e=this.counter++,Object.defineProperty(t,this.id,{value:e})),(i=this.weakmap)[n=t[this.id]]||(i[n]={callbacks:{}})},cleanupWeakReference:function(t,e){return Object.keys(t.callbacks).length||t.pointers&&Object.keys(t.pointers).length?void 0:delete this.weakmap[e]},stubFunction:function(t,e){var i,n,s;return n=t[e],i=this.weakReference(t),s=this.weakmap,t[e]=function(){var e,r,o,u,l,h,a,p,d,c;u=n.apply(t,arguments),a=i.pointers;for(o in a)for(r=a[o],c=null!=(p=null!=(d=s[o])?d.callbacks[r]:void 0)?p:[],l=0,h=c.length;h>l;l++)e=c[l],e();return u}},observeMutations:function(t,e,i){var n,s,r,o,u,h;if(Array.isArray(t)){if(r=this.weakReference(t),null==r.pointers)for(r.pointers={},s=["push","pop","shift","unshift","sort","reverse","splice"],u=0,h=s.length;h>u;u++)n=s[u],this.stubFunction(t,n);if(null==(o=r.pointers)[e]&&(o[e]=[]),l.call(r.pointers[e],i)<0)return r.pointers[e].push(i)}},unobserveMutations:function(t,e,i){var n,s,r;return Array.isArray(t)&&null!=t[this.id]&&(s=this.weakmap[t[this.id]])&&(r=s.pointers[e])?((n=r.indexOf(i))>=0&&r.splice(n,1),r.length||delete s.pointers[e],this.cleanupWeakReference(s,t[this.id])):void 0},observe:function(t,e,i){var n,s,r;return n=this.weakReference(t).callbacks,null==n[e]&&(n[e]=[],s=Object.getOwnPropertyDescriptor(t,e),(null!=s?s.get:void 0)||(null!=s?s.set:void 0)||(r=t[e],Object.defineProperty(t,e,{enumerable:!0,get:function(){return r},set:function(i){return function(s){var o,u,l,h,a;if(s!==r&&(i.unobserveMutations(r,t[i.id],e),r=s,u=i.weakmap[t[i.id]])){if(n=u.callbacks,n[e])for(a=n[e],l=0,h=a.length;h>l;l++)o=a[l],o();return i.observeMutations(s,t[i.id],e)}}}(this)}))),l.call(n[e],i)<0&&n[e].push(i),this.observeMutations(t[e],t[this.id],e)},unobserve:function(t,e,i){var n,s,r;return(r=this.weakmap[t[this.id]])&&(n=r.callbacks[e])?((s=n.indexOf(i))>=0&&(n.splice(s,1),n.length||delete r.callbacks[e]),this.unobserveMutations(t[e],t[this.id],e),this.cleanupWeakReference(r,t[this.id])):void 0},get:function(t,e){return t[e]},set:function(t,e,i){return t[e]=i}},t.factory=function(e){return t.sightglass=e,t["public"]._=t,t["public"]},"object"==typeof("undefined"!=typeof module&&null!==module?module.exports:void 0)?module.exports=t.factory(require("sightglass")):"function"==typeof define&&define.amd?define(["sightglass"],function(e){return this.rivets=t.factory(e)}):this.rivets=t.factory(sightglass)}).call(this);