'use strict';

const gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  babel = require('gulp-babel'),
  rename = require('gulp-rename'),
  concat = require('gulp-concat');

const paths = {
  scripts: [
    './dist/lothus.js',
     './node_modules/navigo/lib/navigo.js',
    './src/exports.js',
    './node_modules/tempimp/dist/tempimp.js',
    './node_modules/rivets/dist/rivets.bundled.min.js'
  ]
};

gulp.task('build', () => {
  let lothus = gulp.src('./src/lothus.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('./dist'));

  let lothusMin = lothus.pipe(concat('lothus.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));

  lothus.on('end', () => {
    let bundled = gulp.src(paths.scripts)
      .pipe(concat('lothus.bundled.js'))
      .pipe(gulp.dest('./dist'));

    bundled.pipe(uglify())
      .pipe(concat('lothus.bundled.min.js'))
      .pipe(gulp.dest('./dist'));
  });
});

gulp.task('watch', () => {
  gulp.watch('./src/lothus.js', ['build']);
});

gulp.task('default', ['watch', 'build']);