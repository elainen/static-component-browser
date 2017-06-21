var gulp = require('gulp');
var staticComponentBrowser = require('static-component-browser');
var connect = require('gulp-connect');
var path = require('path');


gulp.task('build-component-browser', function() {
  staticComponentBrowser({
    output: './built',
    context: './templates',
    globs: [
      './templates/**/*.html'
    ],
    nunjucksOptions: {
      path: './templates',
    }
  });
});

gulp.task('connect', function() {
  connect.server({
    root: './built',
    port: 9000,
    livereload: true,
  });
});



gulp.task('default', ['connect'], function() {
  gulp.start('build-component-browser');
});
