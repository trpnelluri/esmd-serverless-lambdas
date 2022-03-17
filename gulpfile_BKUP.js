'use strict';

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const rimraf = require('rimraf');
const Zip = require('gulp-zip');
const Install = require('gulp-install');
const eslint = require('gulp-eslint');
const run = require('gulp-run');
const map = require('map-stream');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');
const CopyPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

// fetch command line arguments
const arg = (argList => {
    let arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {
        thisOpt = argList[a].trim();
        opt = thisOpt.replace(/^\-+/, '');
        if (opt === thisOpt) {
            // argument value
            if (curOpt) { arg[curOpt] = opt; }
            curOpt = null;
        }
        else {
            // argument name
            curOpt = opt;
            arg[curOpt] = true;
        }
    }
    return arg;
})(process.argv);

// scanning the folders to pick up all the lambdas in the project
let lambdas = {
    root: './lambdas',
    sharedRoot: './sharedLib',
    data: {},
    cleaningTasks: [],
    npmTasks: [],
    npmPruneTasks: [],
    packageTasks: []
};

//resolve lambda names from folders
lambdas.names = fs.readdirSync(lambdas.root).filter(file => fs.statSync(path.join(lambdas.root, file)).isDirectory());
console.log('Processing lambdas:', lambdas.names);
console.log(`Found lambdas: ${JSON.stringify(lambdas.names)}`);
console.log(`Parameters: ${JSON.stringify(arg)}`);

// create the tasks for each lambda
lambdas.names.forEach(lambdaName => {
    let data = {
        path: path.join(lambdas.root, lambdaName),
        build: `./build/${lambdaName}/`
    };
    lambdas.data[lambdaName] = data;

    let cleaningTask = `clean-${lambdaName}`,
        npmTask = `npm-${lambdaName}`,
        npmPruneTask = `npm-prune-${lambdaName}`,
        packageTask = `package-${lambdaName}`;

    // creating the clean folder task...
    lambdas.cleaningTasks.push(cleaningTask);
    gulp.task(cleaningTask, (done) => {
        console.log(`* clean> remove old node_modules from "${lambdaName}"...`);
        rimraf(`${data.path}/node_modules/**`, done);
    });

    // creating the npm-update task...
    lambdas.npmTasks.push(npmTask);
    gulp.task(npmTask, () => {
        console.log(`* npm> npm install "${lambdaName}"...`);
        return gulp.src([`${data.path}/package.json`], {allowEmpty: true})
            .pipe(Install({ignoreScripts: true, production: true, noOptional: true}));
    });

    // creating the npm-prune task...
    lambdas.npmPruneTasks.push(npmPruneTask);
    gulp.task(npmPruneTask, () => {
        console.log(`* npm-prune> npm prune "${lambdaName}" path "${data.path}/*"...`);
        return gulp.src([`${data.path}/*`], {allowEmpty: true})
            .pipe(run('npm prune --production', {}));
    });

    // creating the packing task...
    lambdas.packageTasks.push(packageTask);
    gulp.task(packageTask, () => {
        //if (arg.buildForProd) {
        console.log(`webpack> * "${lambdaName}" with entry point ${data.path}/index.js`);
        return gulp.src([`${data.path}/index.js`], {allowEmpty: true})
            .pipe(gulpWebpack({
                target: 'node',
                node: {
                    // __dirname: false disables webpack processing of __dirname. If you run the bundle in node.js it falls back to the __dirname of node.js (which makes sense for target: node).
                    // __dirname: true let webpack replace __dirname with the path relative to you context. Makes sense for target: web if you need the path.
                    __dirname: false,
                },
                mode: arg.buildForProd ? 'production' : 'development',
                output: {
                    filename: 'index.js',
                    libraryTarget: 'commonjs2'
                },
                optimization: {
                    splitChunks: {
                        cacheGroups: {
                            vendor: {
                                chunks: 'all',
                                filename: 'vendor.js',
                                name: 'vendor',
                                test: /node_modules/,
                            },
                        },
                    },
                },
                 externals: {
                    'aws-sdk': 'aws-sdk', //do not include aws-sdk as it is already in lambda micromachine
                    'chrome-aws-lambda': 'chrome-aws-lambda',  //Error on AWS, cannot find chromium.br file
                },
                 devtool: 'nosources-source-map' // arg.buildForProd ? 'none' : 'inline-source-map' //https://webpack.js.org/configuration/devtool/
            }, webpack))
            .pipe(gulp.src([`${data.path}/schemas/*.json`], {
                base: `${data.path}`
            }))
            .pipe(gulp.src([`${data.path}/templates/*.*`], {
                base: `${data.path}`
            }))
            .pipe(Zip('lambda.zip')) //.pipe(gulp.dest(`${data.path}/dist`));
            .pipe(gulp.dest(data.build));
    });

    //task in lambdaname covers all tasks
    gulp.task(lambdaName, gulp.series(cleaningTask, npmTask, packageTask));
});

gulp.task('npm-shared-lib', () => {
    console.log('* npm> npm install sharedLib...');
    return gulp.src([`${lambdas.sharedRoot}/package.json`],{allowEmpty: true})
        .pipe(Install({ignoreScripts: true, production: true, noOptional: true}));
});

gulp.task('clean-shared-lib', (done) => {
    console.log(`* clean> remove old node_modules from "${lambdas.sharedRoot}"...`);
    rimraf(`${lambdas.sharedRoot}/node_modules/**`, done);
});

gulp.task('clean-all', gulp.parallel('clean-shared-lib', lambdas.cleaningTasks));
gulp.task('npm-all', gulp.parallel('npm-shared-lib', gulp.series(lambdas.cleaningTasks, lambdas.npmTasks)));
gulp.task('pack-all', gulp.series(lambdas.packageTasks));
gulp.task('prune-all', gulp.series(gulp.parallel(lambdas.npmPruneTasks))); //todo, not yet working

gulp.task('eslint', () => {
    return gulp.src(['./lambdas/**/*.js', '!./lambdas/**/node_modules/**'])
        .pipe(eslint())
        .pipe(consoleReporter)
        .pipe(eslint.failAfterError());
});

const consoleReporter = map(function (file, cb) {
    if (!file.eslint || (file.eslint.errorCount === 0)) {
        return cb(null, file);
    }
    file.eslint.messages.forEach(function (message) {
        if (message.warn === true) {
            console.log(`#warn# ${file.eslint.filePath}:${message.line}:${message.column} => ${message.source} ===> ${message.message}`);
            return;
        }
        console.log(`at (${file.eslint.filePath}:${message.line}:${message.column})`);
        console.log(`=> ${message.ruleId} ===> ${message.message} `);
    });
    cb(null, file);
});

// problem with the webpack, failing sometimes in parallel
gulp.task('default', gulp.series('npm-shared-lib', gulp.series(lambdas.names)));