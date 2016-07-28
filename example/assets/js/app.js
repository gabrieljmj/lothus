window.onload = () => {
  // Creates Lothus app
  const app = new Lothus();

  // Sorts alphabeticallycities
  cities.sort(sortAlphabetically);

  // Registers the colletions as data providers
  app.provider('cities', {citiesList: cities});

  // Registers events to be used as page events
  app.events = {
    onCities: () => {
      document.getElementById('cities-search').addEventListener('keyup', e => {
        search(cities, 'name', e.target).then(result => {
          let citiesList = document.getElementById('cities-list'),
          noCitiesFound = document.getElementById('no-cities-found');

          if (!result.length) {
            citiesList.style.display = 'none';
            noCitiesFound.style.display = '';
          } else {
            citiesList.style.display = '';
            noCitiesFound.style.display = 'none';
          }

          app.provider('cities', {citiesList: result});
        });
      });
    },
    onCity: params => {
      let map = document.getElementById('map'),
      cityNotFoundOnList = document.getElementById('city-not-found-on-list');

      if (!foundOnCityList(decodeURI(params.name))) {
        map.style.display = 'none';
        cityNotFoundOnList.style.display = '';
      } else {
        map.style.display = '';
        cityNotFoundOnList.style.display = 'none';

        document.getElementById('map-iframe').src = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyDh5jZil4ENCQWuc15LS05zoHXAXKrYVwo&q=' + params.name;
      }
    }
  };

  /**
   * Binder for rv-cityhref
   */
  app.dataBinder.binders.cityhref = (element, value) => {
    element.setAttribute('href', '#city/' + encodeURI(value));
  };

  /**
   * Formmater to decode uri
   */
  app.dataBinder.formatters.decode_uri = value => {
    return decodeURI(value);
  };

  // Initialize the application
  app.init();

  /**
   * Search throught collections
   *
   * @param {Array} collection
   * @param {Object} input
   *
   * @return {Promise}
   */
   function search(collection, by, input) {
    return new Promise(resolve => {
      let q = input.value,
      result = [];

      collection.forEach((el, k) => {
        if (el[by].toLowerCase().search(q.toLowerCase()) > -1) {
          result.push(el);
        }
      });

      resolve(result);
    });
  }

  function foundOnCityList(city) {
    for (let k = 0; k < cities.length; k++) {
      if (cities[k].name === city) {
        return true;
      }
    }

    return false;
  }
};