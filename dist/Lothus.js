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