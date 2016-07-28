<h1 align="center">
<img src="http://i.imgur.com/EbSONvm.png">
</h1>
<p align="center">Framework for fast development of single page applications</p>

## Installation
Include Lothus file
```html
<script src="lothus.bundled.min.js"></script>
```

## Usage
Each ```page``` element is a part of your system. In this element, you indicate the route, page title, data provider and events. The page content can be inside the tag or in another HTML file.

See the examples below:

```html
<body>
  <page
    name="hello"
    route="hello/:name"
    default>
    <h1>Hello, { _params.name }</h1>
  </page>

  <script src="lothus.bundled.min.js"></script>

  <script>
    window.onload = () => {
      const app = new Lothus();

      app.init();
    };
  </script>
</body>
```

will print

```
// http://domain.com/#hello/Mano
Hello, Mano!
```

### Routing
Use the attribute ```route```. To indicate a parameters, use ```:``` before it and to access them, use ```_params```.
```html
<page name="hello" route="hello/:from/to/:to">
  { _params.from } said hello to { _params.to }
</page>
```

### Data binding
> Lothus uses [Rivets](rivetsjs.com) data binder

It's possible to create data providers with real-time updated data and pass them to pages.

First, create a provider before initialize
```js
app.providers.userData = {
  name: 'Gabriel',
  nickname: 'gabrieljmj'
};
```

then indicate the provider in the page

```html
<page ... data-provider="userData">
  Name: { name }, Nickname: { nickname }
</page>
```

#### Accessing Rivets
To do stuff like add binders, access the property ```dataBinder```
```js
const app = new Lothus();

app.dataBinder.binders['custom-binder'] = (element, value) => {
  // ...
};
```

### Importing page
The HTML does not need to be inside ```page```, you can import from a extern file using ```origin```. This helps keep the code orgaized.
```html
<!-- hello.html -->
Hello, { _params.name }!
```
```html
<!-- index.html -->
<page name="hello" route="hello/:name" origin="hello.html"></page>
```

### Events
#### ```onload```
Executed everytime that a page is loaded.

Add the event to ```{app|lothus}.events``` and put the event name in ```onload``` attribute. The event ```this``` will be the ```page``` element.
```js
app.events.onHelloLoad = params => {
  // 'this' is the page element
};
```

```html
<page ... onload="onHelloLoad"></page>
```

#### ```onunload```
Executed everytime that a page is changed by another.

```js
app.events.onHelloUnload = () => {
  // 'this' is the page element
};
```
```html
<page ... onunload="onHelloUnload"></page>
```

### License
This library is under [MIT Licesne](https://github.com/gabrieljmj/lothus/blob/master/LICENSE).