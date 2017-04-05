const cleanLinkName = str => {
  return str.replace('.html', '')
            .replace(/[_|-]/g, ' ')
            .replace(/\b[a-z]/g, x => { return x.toUpperCase(); });
};


const buildTree = (results, items) => {
  if (items.length === 1) {
    return results.concat({name: items[0], children: null});
  } else {
    const existingItem = results.filter(i => { return i.name === items[0]; });
    if (existingItem.length > 0) {
      const indexOfItem = results.findIndex(i => { return i.name === items[0]; });
      results[indexOfItem].children = buildTree(results[indexOfItem].children, items.slice(1, items.length));
      return results;
    } else {
      return results.concat({name: items[0], children: buildTree([], items.slice(1, items.length))});
    }
  }
};


const createNavDOM = (path, treeObject) => {
  if (treeObject.children === null) {
    return `<li>\n<a href="${path}/${treeObject.name}">${cleanLinkName(treeObject.name)}</a>\n</li>`;
  } else {
    let childrenList = `<li>\n<em>${treeObject.name}</em>\n<ul>\n`;
    for (const child of treeObject.children) {
      childrenList = childrenList.concat(createNavDOM(`${path}/${treeObject.name}`, child));
    }
    return childrenList.concat('</ul>\n</li>\n');
  }
};


const renderNavigationItems = ({sideBarSelector, componentBrowserPath}) => {
  const sideBarDOMElement = document.querySelector(sideBarSelector);
  if (sideBarDOMElement) {
    let navigationTree = [];
    if (window.navigationItems) {
      for (const arr of window.navigationItems) {
        let pathArray = arr.split('/');
        if (pathArray[0] === componentBrowserPath) {
          pathArray = pathArray.slice(1, pathArray.length);
        }
        navigationTree = buildTree(navigationTree, pathArray);
      }
    }

    let results = '<ul>\n';
    for (const item of navigationTree) {
      results = results.concat(createNavDOM(`/${componentBrowserPath}`, item));
    }
    results = results.concat('</ul>');

    const xmlString = results;
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/html');
    sideBarDOMElement.appendChild(doc.body.firstChild);
  }
};

const renderActiveNavItem = ({linkSelector}) => {
  const links = document.querySelectorAll(linkSelector);
  for (const currLink of links) {
    if (currLink.href === window.location.href) {
      currLink.dataset.selected = true;
    } else {
      currLink.dataset.selected = false;
    }
  }
};


document.addEventListener('DOMContentLoaded', () => {
  const sideBarSelector = '.component-browser__sidebar';
  const componentBrowserPath = 'component-browser';
  renderNavigationItems({sideBarSelector, componentBrowserPath});
  renderActiveNavItem({linkSelector: `${sideBarSelector} a`});
});
