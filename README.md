# static-component-browser

A utility to browse through static components using nunjucks.


## Example
Check out the `/example` directory for a bare bone example.


## Installation
`npm install static-component-browser --save`



## Configuration

### Gulp
In gulpfile.js:

```
var staticComponentBrowser = require('static-component-browser');

gulp.task('build-component-browser', function() {
  staticComponentBrowser({
    output: './built',
    context: 'src/templates',
    globs: [
      './src/templates/**/*.html'
    ],
    nunjucksOptions: {
      path: templates,
    },
    baseTemplate: path.join(__dirname, 'src/templates/component-browser/_base.html')
  });
});
```

#### staticComponentBrowser(options)

##### options
Type: `Object`, required

Variables to build the component browser. Returns a Promise with a resolve value as an array of all paths of the components that have been collected.


###### options.output
Type: `String`, required

The built directory to populate the component browser. A folder `/component-browser/` will be created with the components inside.

###### options.context
Type: `String`, required

Relative base directory path from where all the components will be coming from.

###### options.globs
Type: `String` or `Array`, required

Glob that matches the different html components.

###### options.nunjucksOptions
Type: `Object`

Optional options that are passed to the nunjucks render loader.


###### options.baseTemplate
Type: `String` or `Array`, default: uses a built in `_base.html`

The base template used for the component browser. If path is not specified, a built in _base.html will be used.

*Sidebar* - To render the sidebar, add the below somewhere in your base:
```
<div class="component-browser__sidebar"></div>
```
*Component* - To render the component, add the below somewhere in your base:
```
{% block componentBrowserComponent %}{% endblock %}
```



## Usage

Components can be added into the component browser from within the html file. Adding certain comment tags will enable the collection of these select components.

### Add Component to Browser
Add `{# static-component-browser show #}` to the top of the component html file.

*learn_more_button.html*
```
{# static-component-browser show #}
<div><a href="/">Learn More</a></div>
```
### Use Variable Examples with Component
Set the variables within a `{# static-component-browser example <variables> #}` comment block.

*page_headline.html*
```
{# static-component-browser show #}
{# static-component-browser example
  {% set header = 'My Headline Header' %}
  {% set subheader = 'Lorem Ipsum dolor sit amet' %}
#}

<div class="page-headline">
  <div class="page-headline__header">{{ header }}</div>
  {% if subheader %}
  <div class="page-headline__sub-header">{{ subheader }}</div>
  {% endif %}
</div>

```
### Add Custom Templates

Add a `component-browser/` directory within the specified `options.components` glob. The `_base.html` and `index.html` will be used if it exists within the directory.

Custom templates tailored specifically for the browser can also be added here.

Folder structure example for the above gulp example, with `globs: ['./src/templates/**/*.html']`:

```
src
└── templates
    └── component-browser
        └── _base.html
        └── index.html
        └── components
          └── mix_header_section.html
```

### Tests

This project uses [jest](http://facebook.github.io/jest/). To run the test script, run `npm test`.
