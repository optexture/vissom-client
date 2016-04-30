var gulp = require('gulp');
//var babel = require('gulp-babel');

var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
//var concat = require('gulp-concat');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var Server = require('karma').Server;

var path = {
    src: {
        styles: 'scss/**/*.scss',
        js: ['src/**/*.js']
    },

    dest: {
        build: 'dist/'
    }
};

/**
 * launch local webserver
 */
gulp.task('serve-browsersync', function () {
    browserSync.init({
        open: false,
        port: 3000,
        server: {
            //baseDir: path.dest.build
        }
    });
});


/**
 * run tests once, and exit
 */
gulp.task('run-karma', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function () { done(); }).start();
});


/**
 * process scss
 */
gulp.task('process-scss', function () {
    return gulp.src(path.src.styles)
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        // .pipe(autoprefixer({ browsers: ['last 2 versions', 'Android', 'iOS', 'and_chr', 'and_ff', 'ie_mob', 'bb'] }))

        //.pipe(gulp.dest(path.dest.build + 'css/'))
        .pipe(gulp.dest('css/'))

        .pipe(browserSync.stream());
});

gulp.task('watch', function () {
    gulp.watch(path.src.styles, ['process-scss']);
});

// todo: concat and minify
// todo: inject js/css inline into index.html ?

gulp.task('default', ['process-scss', 'serve-browsersync', 'watch']);

/**
 * Copy dependencies from other projects
 */
gulp.task('copy-deps', function () {
    return gulp.src([
        '../shui/lib/engine.io.js',
        '../shui/lib/shui.deps.js',
        '../shui/dist/shui.js'
    ])
        .pipe(gulp.dest('lib'));
});

/**
 * Copy debug files from other projects
 */
gulp.task('copy-debug', function () {
    return gulp.src([
            '../shui/client/shui-debug.html'
        ])
        .pipe(gulp.dest('client'));
});