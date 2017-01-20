var gulp = require('gulp');
var rename = require('gulp-rename');

gulp.task('default', function() {
  return gulp.src(['./frontend/build/static/js/*.js', './frontend/build/static/css/*.css', './frontend/build/static/js/*.map'])
             .pipe(rename(function(path) {
              console.log('path', path);
              console.log('path.extname', path.extname);
                if (path.extname !== '.map') {
                  path.basename = "bundle";
                }
              }))
             .pipe(gulp.dest('./app/static/'));
});
