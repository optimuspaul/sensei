var gulp = require('gulp');
var rename = require('gulp-rename');

gulp.task('default', function() {
  return gulp.src(['./frontend/build/static/js/*.js', './frontend/build/static/css/*.css'])
             .pipe(rename(function(path) {
                path.basename = "bundle";
              }))
             .pipe(gulp.dest('./app/static/'));
});
