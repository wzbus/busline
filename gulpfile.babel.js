import gulp from 'gulp';
import babel from 'gulp-babel';
import cached from "gulp-cached";
import autoprefixer from 'gulp-autoprefixer';
import cleanCss from 'gulp-clean-css';
import uglify from 'gulp-uglify';
import rev from 'gulp-rev';
import revCollector from 'gulp-rev-collector';
import connect from "gulp-connect";
import del from 'del';

gulp.task('css', () => {
  return gulp.src('app/css/**/*.css')
    .pipe(cached('css'))
    .pipe(autoprefixer({
      overrideBrowserslist: ['> 5%'],
      cascade: false
    }))
    .pipe(cleanCss({
      advanced: false,
      compatibility: 'ie8',
      keepBreaks: false,
      keepSpecialComments: '*'
    }))
    .pipe(rev())
    .pipe(gulp.dest('dist/css'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('rev/css'))
});

gulp.task('js', function () {
  return gulp.src('app/js/**/*.js')
    .pipe(cached('js'))
    .pipe(babel())
    .pipe(uglify({
      mangle: false
    }))
    .pipe(rev())
    .pipe(gulp.dest('dist/js'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('rev/js'))
});

gulp.task('pic', function () {
  return gulp.src('app/pic/**/*')
    .pipe(cached('pic'))
    .pipe(gulp.dest('dist/pic'));
});

gulp.task('font', function () {
  return gulp.src('app/font/**/*')
    .pipe(cached('font'))
    .pipe(gulp.dest('dist/font'));
});

gulp.task('api', function () {
  return gulp.src('app/api/**/*')
    .pipe(cached('api'))
    .pipe(gulp.dest('dist/api'));
});

gulp.task('html', function() {
  return gulp.src(['rev/**/*.json', 'app/*.html'])
    .pipe(cached('html'))
    .pipe(revCollector({
      replaceReved: true
    }))
    .pipe(gulp.dest('dist'))
});

gulp.task('clear', function () {
  return del(['dist/*']);
});

gulp.task("reload", function () {
  return gulp.src('app/*.html')
    .pipe(connect.reload());
})

gulp.task('watch', function() {
  gulp.watch('app/*.html', gulp.series('html'));
  gulp.watch('app/font/**/*', gulp.series('font'));
  gulp.watch('app/css/**/*.css', gulp.series('css'));
  gulp.watch('app/js/**/*.js', gulp.series('js'));
  gulp.watch('app/pic/**/*', gulp.series('pic'));
  gulp.watch('dist/**/*', gulp.series('reload'));
});
 
gulp.task('connect', function () {
  connect.server({
    root: 'dist',
    port: 3000,
    livereload: true
  });
});

gulp.task('default', gulp.series('clear', gulp.parallel('css', 'js', 'pic', 'font'), 'html'));

gulp.task('server', gulp.series('default', gulp.parallel('connect', 'watch')));