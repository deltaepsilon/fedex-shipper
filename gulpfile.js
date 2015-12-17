var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var minifyInline = require('gulp-minify-inline');
var gulpCopy = require('gulp-copy');

gulp.task('copy', function () {
  return gulp.src([
    './bower_components/firebase/firebase.js',
    './favicon.ico'
    ])
    .pipe(gulpCopy('./public'));
});

gulp.task('vulcanize', function () {
  return gulp.src('app/index.html')
    .pipe(vulcanize({
      inlineScripts: true,
      inlineCss: true,
      stripComments: true,
      excludes: ['./bower_components/firebase/firebase.js']
    }))
    .pipe(minifyInline({
      cssSelector: 'style[minify="true"]'
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('default', ['copy', 'vulcanize']);