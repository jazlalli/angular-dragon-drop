# angular-drag-and-drop
"Drag and drop" directives for AngularJS. Work in progress.

## Usage
1. Include the `angular-drag-and-drop.js` script provided by this component into your app.
2. Add `drag-and-drop` as a module dependency to your app.

Repeats a template inside the drag-and-drop over a list. List items need to wrapped in a div in order to maintain placeholders when you move an item into another list.
```html
<ul drag-and-drop="item in list">
  <li>
    <div>{{item.name}}</div>
  </li>
</ul>
<ul drag-and-drop="item in otherList">
  <li>
    <div>{{item.name}}</div>
  </li>
</ul>
```
You can drag from one onto another, and the models will be updated accordingly.

It also works on objects:
```html
<ul drag-and-drop="(key, value) in list">
  <li>
    <div>{{key}}: {{value}}</div>
  </li>
</ul>
<ul drag-and-drop="(key, value) in otherList">
  <li>
    <div>{{key}}: {{value}}</div>
  </li>
</ul>
```


## Config
This is not a kitchen sink every-option-you-can-think-of module.
This is a starting point.
Configure by forking and editing the code according to your needs.
Send a PR if you think your additions are widely useful. :)

### drag-and-drop-double
Instead of removing values from the array this dragon is bound to, the values are duplicated.
Add the `drag-and-drop-double` attribute to an element with the `drag-and-drop` attribute to get the behavior.

Example:
```html
<h2>These get copied</h2>
<ul drag-and-drop="item in list" drag-and-drop-double>
  <li>
    <div>{{item.name}}</div>
  </li>
</ul>
<ul drag-and-drop="item in otherList">
  <li>
    <div>{{item.name}}</div>
  </li>
</ul>
```

### drag-and-drop-accepts
Makes the dragon only accept items that pass the truth test function given by this argument.
Add the `drag-and-drop-accepts` attribute to an element to get the behavior.

Example:
```html
<h2>You can only put shiny objects here</h2>h2>
<ul drag-and-drop="item in list" drag-and-drop-accepts="shinyThings">
  <li>
    <div>{{item.name}}</div>
  </li>
</ul>
<ul drag-and-drop="item in otherList">
  <li>
    <div>{{item.name}}</div>
  </li>
</ul>
```

```javascript
// in a Ctrl...
$scope.shinyThings = function (item) {
  return !!item.shiny;
};
```

## Example
See [`example.html`](http://htmlpreview.github.io/?https://github.com/jazlalli/angular-dragon-drop/blob/master/example.html).

## License
MIT
