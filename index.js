const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const mkdirp = require('mkdirp');
const change = require('gulp-change');
const fs = require('fs');
const eventStream = require('event-stream');
const gulpIf = require('gulp-if');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const nunjucksRender = require('gulp-nunjucks-render');
const minimatch = require('minimatch');


const exampleMatch = /{#[ ]*static-component-browser[ ]*example/;
const componentPlaceholder = /{%[ ]*block componentBrowserComponent[ ]*%}([\w\s]*){%[ ]*endblock[ ]*%}/g;
const showComponentRegex = /{#[ ]*static-component-browser[ ]*show[ ]*#}/g;
const extendedTemplateRegex = /{%[ ]*extends/;

const componentBrowserDirectory = 'component-browser';
const sbSrcDirectory = path.join(__dirname, 'src');
const baseAssets = `
  \n<link rel="stylesheet" href="/${componentBrowserDirectory}/css/main.css" media="screen" />\n
  <script type="text/javascript" src="/${componentBrowserDirectory}/js/main.js"></script>\n
`;


const shouldShow = file => { return !!file.contents.toString().match(showComponentRegex); };

const enableExampleChunk = content => {
  if (content.match(exampleMatch)) {
    const exampleIndex = content.match(exampleMatch).index;
    const endExampleIndex = content.indexOf('#}', exampleIndex);
    content = content.substr(0, endExampleIndex) + content.substring(endExampleIndex + 2, content.length);
    content = content.replace(exampleMatch, '');
  }
  return content;
};

const getComponentPaths = components => {
  return components.reduce((result, componentData) => {
    return result.concat(componentData.path);
  }, []);
};


module.exports = config => {
  return new Promise((resolve, reject) => {
    gutil.log(gutil.colors.green('Building component browser...'));

    let outputPath = null;
    let componentGlob = null;
    if (config.output) outputPath = config.output;
    else throw gutil.colors.red('options.output is not defined.');

    if (config.globs) componentGlob = config.globs;
    else throw gutil.colors.red('options.globs is not defined.');

    const cbPath = path.join(outputPath, componentBrowserDirectory);
    const cbPathComponents = path.join(cbPath, 'components');
    if (!config.dryRun) mkdirp.sync(cbPath);

    let baseTemplate = null;
    try {
      baseTemplate = fs.readFileSync((config.baseTemplate ? config.baseTemplate : `${sbSrcDirectory}/templates/_base.html`), {encoding: 'utf-8'});
    } catch (error) {
      throw gutil.colors.red(`${error}`);
    }

    const getComponents = compGlob => {
      return new Promise((resolve, reject) => {
        let components = [];
        gulp.src(compGlob)
          .pipe(gulpIf(shouldShow, eventStream.map((data, callback) => {
            components = components.concat(data);
            return callback();
          })))
          .once('finish', () => { resolve({components}); })
          .on('error', () => { reject(); });
      });
    };

    const purgeOldComponents = data => {
      return new Promise((resolve, reject) => {
        const {components} = data;
        gulp.src(`${cbPathComponents}/*.html`)
          .pipe(gulpIf(file => {
            return components.filter(component => { return component.relative === file.relative; }).length <= 0;
          }, vinylPaths(del)))
          .once('finish', () => {
            gutil.log(gutil.colors.green('Removed old components...'));
            resolve(data);
          })
          .on('error', () => { reject(); });
      });
    };

    const collectComponents = data => {
      return new Promise((resolve, reject) => {
        const {components} = data;
        let navigationObjectList = [];
        for (const index in components) {
          navigationObjectList = navigationObjectList.concat(components[index].relative);
        }
        const base = config.context ? {base: config.context} : null;
        let componentPaths = getComponentPaths(components);

        const hasIndexPage = getComponentPaths(components).filter(item => { return item.indexOf('index.html') >= 0; }).length > 0;
        if (!hasIndexPage) {
          const indexPath = path.join(sbSrcDirectory, 'templates', 'index.html');
          componentPaths = componentPaths.concat(indexPath);
          navigationObjectList.unshift(`${componentBrowserDirectory}/index.html`);
        }
        gulp.src(componentPaths, base)
          .pipe(change(content => {

            if (baseTemplate && !content.match(extendedTemplateRegex)) {
              let mergedContent = null;
              mergedContent = baseTemplate.replace(componentPlaceholder, enableExampleChunk(content));
              return mergedContent;
            } else {
              return content;
            }
          }))
          // TODO: Handle errors when running nunjucks
          .pipe(nunjucksRender(config.nunjucksOptions))
          .pipe(change(content => {

            content = content.replace('</head>', `${baseAssets}\n</head>`);
            content = content.replace('</body>', `<script>window.navigationItems = ${JSON.stringify(navigationObjectList)}</script>\n</body>`);
            return content;
          }))
          .pipe(gulpIf(!config.dryRun, gulp.dest(file => {
            if (minimatch(file.relative, 'component-browser/**/**/*.html')) {
              return outputPath;
            } else if (minimatch(file.path, '**/index.html')) {
              file.path = path.join(file.base, componentBrowserDirectory, path.basename(file.path));
              return outputPath;
            } else {
              return cbPath;
            }
          })))
          .on('data', chunk => { gutil.log('Collected component', gutil.colors.dim(`${config.context}/${chunk.relative}`)); })
          .once('end', () => {

            resolve(data);
          })
          .on('error', () => { reject(); });
      });
    };

    const collectAssets = data => {
      return new Promise((resolve, reject) => {
        gulp.src([`${sbSrcDirectory}/js/*.js`, `${sbSrcDirectory}/css/*.css`], {base: sbSrcDirectory})
          .pipe(gulpIf(!config.dryRun, gulp.dest(() => {
            if (config.dryRun) return null;
            else return cbPath;
          })))
          .on('data', chunk => gutil.log('Collected asset ', gutil.colors.dim(`${__dirname}/${chunk.relative}`)))
          .once('end', () => resolve(data))
          .on('error', () => { reject(); });
      });
    };

    const taskPromise = Promise.resolve(componentGlob)
      // Collect all the components to process
      .then(getComponents)
      // Remove components that are not part of the new set
      .then(purgeOldComponents)
      // Build out links and add to _base.html
      .then(collectComponents)
      // Collect the js and css assets for the component browser
      .then(collectAssets)
      .then(data => {
        gutil.log(gutil.colors.green(`Component browser collected into ${outputPath}/${componentBrowserDirectory}`));
        resolve(getComponentPaths(data.components));
      });
  });
};
