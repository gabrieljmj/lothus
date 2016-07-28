// Polifyll for Object.assign
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
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
  let parts = route.split('/'),
    has = false;

  parts.forEach(part => {
    if (part.substr(0, 1) === ':') has = true;
  });

  return has;
}

function changePageTitle(newTitle, doc) {
  doc = doc || document;

  doc.title = newTitle || doc.title;
}

class Lothus {
  constructor(doc) {
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
  init() {
    return new Promise(resolve => {
      // Searches for all pages using 'name' and 'route' attributes
      let pages = this._document.querySelectorAll('page[name][route]'),
        // Search all pages using 'default' attribute
        home = this._document.querySelectorAll('page[name][route][default]'),
        defaultRoute,
        routes = {};

      // Check if more than one page or none are using 'default' attribute
      if (!!!home.length || home.length > 1) {
        throw new Error('An unique default page is necessary. ' + home.length + ' indicated');
      }

      home = home[0];

      pages.forEach(page => {
        // Generate page options
        let opts = this._getOptions(page),
          regexRoute = page.attributes.regexRoute;

        this._routes[opts.name] = opts;

        let name = page.attributes.name.value,
          route =  page.attributes.route.value;
        
        // Creates a route following navigo standard
        routes[route] = {
          as: name,
          uses: params => {
            let self = this;

            params = params || {};

            // Check if page has a data provider
            // Data provider will be used to pass URL parameters through the page
            if (opts.dataProvider) {
              if (!this._providers[opts.dataProvider]) {
                this._providers[opts.dataProvider] = {};
              }

              this.provider(opts.dataProvider, {_params: params});
            } else {
              // Creates a generic data provider for page
              let providerName = '__for_' + name;

              this.provider(providerName, {_params: params});

              opts.dataProvider = providerName;
            }

            this._handleRoute(opts).then(route => {
              // Updates the page title
              changePageTitle(route.title, self._document);

              // Hides all other pages
              self._document.querySelectorAll('page[name][route]').forEach(page => {
                page.style.display = page.attributes.name.value !== route.name ? 'none' : '';
              });
            });
          }
        };

        if (page === home) {
          if (routeHasParameters(route)) {
            throw new Error('Default route must not have parameters.');
          } 

          this._defaultRoute = name;
        }
      });

      // Register routes on Navigo
      this.router.on(routes);

      this._applyEvents();

      this._initRouter();

      resolve();
    });
  }

  /**
   * Sets data of a provider and update the page with the new data
   *
   * @param {String} name
   * @param {Object} value
   */
  provider(name, data) {
    if (typeof data !== 'object') {
      throw new Error('Data providers can only be objects');
    }

    if (!this._providers[name]) {
      this._providers[name] = {};
    }

    let newData = Object.assign(this._providers[name], data);

    if (!this._originalProviders[name]) {
      this._originalProviders[name] = {};

      for (let k in newData) {
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
  _applyEvents() {
    let self = this;

    // On page changing
    window.onhashchange = function() {
      // Saves page on history
      if (window.history.pushState) {
        window.history.pushState(null, null, window.location.href);
      }

      self._initRouter();
    };
  }

  _initRouter() {
    this.router.resolve();

    // Check if no route is beein used, so render the one defined as default (index)
    if (window.location.hash === '' || window.location.hash === '#') {
      this._renderDefaultRoute();
    }
  }

  /**
   * Redners the default (index) route
   */
  _renderDefaultRoute() {
    window.location.hash = '#' + this._routes[this._defaultRoute].route;
    //this._handleRoute(this._routes[this._defaultRoute]);
  }

  /**
   * Data binding for certain route
   *
   * @param {Object} route
   */
  _render(route) {
    if (route && route.dataProvider) {
      const data = this._providers[route.dataProvider];
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
  _getOptions(route) {
    let opts = {name: route.attributes.name.value, route: route.attributes.route.value, clone: route.cloneNode(true)};

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

  _handleRoute(opts) {
    return new Promise(resolve => {
      let route = opts,
        location = window.location.href;

      this._handleEvent(route).onunload();

      // Verifies if page has an external origin
      if (route.origin) {
        let self = this;

        // Imports the external page
        importTemplate(route.origin).then(content => {
          self._document.querySelector('page[name="' + route.name + '"]').innerHTML = content.body.innerHTML;
          self._render(route);

          self._handleEvent(route).onload();
        });
      } else {
        this._render(route);

        this._handleEvent(route).onload();
      }

      resolve(route);
    });
  }

  _handleEvent(route) {
    let self = this,
      currentPageElement = this._document.querySelector('page[name="' + route.name + '"]');

    return {
      onload: function handleOnloadEvent() {
        if (route.onload) {
          self.events[route.onload].bind(
            currentPageElement,
            self._providers[route.dataProvider]._params
          ).call();
        }
      },
      onunload: function handleOnunloadEvent() {
        if (self._lastRoute) {
          if (self._routes[self._lastRoute].onunload) {
            self.events[self._routes[self._lastRoute].onunload].call();
          }

          let lastRoute = self._routes[self._lastRoute];

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
}

if (typeof module === 'object') {
  module.exports = Lothus;
} else if (typeof exports === 'object') {
  exports.Lothus = Lothus;
}