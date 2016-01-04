var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var minifyInline = require('gulp-minify-inline');
var gulpCopy = require('gulp-copy');
var browserSync = require('browser-sync');
var superstatic = require('superstatic');
var Firebase = require('firebase');
var FirebaseTools = require('firebase-tools');
var env = require('./env.json').servers[process.env.NODE_ENV];
var shell = require('gulp-shell');
var fs = require('fs');
var firebaseConfig = require('./firebase.json');

gulp.task('copy', function () {
  return gulp.src([
      './bower_components/firebase/firebase.js',
      // './bower_components/webcomponentsjs/webcomponents-lite.js',
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

gulp.task('env', function (done) {
  var envRef = new Firebase(env.firebase.root + '/env');
  envRef.authWithCustomToken(process.env.FEDEX_FIREBASE_SECRET, function (err, authData) {
    if (err) {
      console.log('err', err);
    } else {
      envRef.set(require('./env.json'), function (err) {
        err ? console.log('set error', err) : done();
      });
    }
  });
})

gulp.task('make-public', function (done) {
  firebaseConfig.public = 'public';
  fs.writeFileSync('./firebase.json', JSON.stringify(firebaseConfig), 'utf8');
  done();
});

gulp.task('make-app', function (done) {
  firebaseConfig.public = 'app';
  fs.writeFileSync('./firebase.json', JSON.stringify(firebaseConfig), 'utf8');
  done();
});

gulp.task('firebase-deploy', shell.task(['firebase deploy']));

gulp.task('superstatic', function () {
  browserSync({
    port: 8000,
    server: {
      baseDir: 'app',
      routes: {
        "/bower_components": "bower_components"
      },
      middleware: superstatic()
    }
  });

  gulp.watch("app/**", browserSync.reload);
});

gulp.task('done', function (done) {
  process.nextTick(function () {
    process.exit(0);
  });

});

gulp.task('serve', ['make-app', 'superstatic']);

gulp.task('default', ['copy', 'vulcanize']);

gulp.task('deploy', ['copy', 'vulcanize', 'env', 'make-public', 'firebase-deploy']);

gulp.task('test', ['make-public', 'make-app', 'done']);

// gulp.on('stop', function () {
//    process.nextTick(function () {
//       process.exit(0); 
//    });
// });