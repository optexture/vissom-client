var gulp = require('gulp');

var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

var path = {
    src: {
        styles: 'scss/**/*.scss',
        libs: 'lib/**/*.js',
        js: ['js/**/*.js'],
        svg: ['vissom-logo.svg', 'vissom-shapes.svg']
    },

    dest: {
        build: 'dist/'
    }
};

var apOptions = { browsers: ['last 2 versions', 'android > 2.1', 'ios > 3.2', 'and_chr > 30', 'and_ff > 40', 'ie_mob >= 10', 'bb >= 10', 'op_mob >= 12', 'op_mini >= 5'] };

/**
 * launch local webserver
 */
gulp.task('serve-browsersync', function () {
    browserSync.init({
        open: false,
        port: 3000,
        server: {
            //baseDir: path.dest.build
        },
        logConnections: true,
        reloadOnRestart: true
    });
});


/**
 * process scss
 */
gulp.task('process-scss', function () {
    return gulp.src(path.src.styles)
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer(apOptions))

        .pipe(gulp.dest('css/'))

        .pipe(browserSync.stream());
});

gulp.task('watch', function () {
    gulp.watch(path.src.styles, ['process-scss']);
});

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

/**
 * Main build task
 */
gulp.task('build', function () {
    gulp.src(path.src.libs)
        .pipe(gulp.dest(path.dest.build + 'lib/'));

    gulp.src(path.src.js)
        .pipe(gulp.dest(path.dest.build + 'js/'));
    
    gulp.src(path.src.svg)
        .pipe(gulp.dest(path.dest.build));
    
    gulp.src('index.html')
        .pipe(gulp.dest(path.dest.build));

    return gulp.src(path.src.styles)
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer(apOptions))
        .pipe(gulp.dest(path.dest.build + 'css/'));
});