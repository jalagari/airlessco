import { createMetadataBlock } from './common.js';
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */

const createAutoBlock = (main, document) => {
  const title = document.createElement('h1');
  const h1 = document.querySelector('body > div.container.start > h1');
  title.replaceChildren(...h1.childNodes);
  main.append(title);
  const body = document.querySelector('body > div.container.start > div.row.rowpadding > div');
  const p = document.createElement('p');
  p.textContent = body.textContent;
  main.append(p);
  h1.remove();
  body.parentElement.remove(); // Delete this for processing the tables.
};

const createImage = (document, main, container) => {
  const p = document.createElement('p');
  const img = container.querySelector('img');
  if (img) {
    const { parentElement } = img;
    p.append(img);
    parentElement.remove();
  } else {
    container.querySelector(':first-child').remove();
  }
  main.append(p);
};

const createDetailsBlockMarkdown = () => [['Accessories Details']];

const createAccessoriesDetailBlock = (document, main, container, url) => {
  const rows = container.querySelectorAll('div > .row');
  let block;
  let productId;
  rows.forEach((row) => {
    const locale = new URL(url).pathname.replace(/^\/(\w+)\/(\w+)\/.*/, '$1_$2');
    const heading = row.querySelector('h3');
    if (heading) {
      if (block) {
        main.append(WebImporter.DOMUtils.createTable(block, document));
      }
      block = createDetailsBlockMarkdown(document);
      block.push([heading.outerHTML]);
    } else {
      if (row.querySelector('div.col-sm-4.col-md-3') && row.querySelector('div.col-sm-8.col-md-9')) {
        const secondCols = row.querySelectorAll('div.col-sm-8.col-md-9');
        if (!productId) productId = row.querySelector('div.col-sm-8.col-md-9').textContent;

        let cell = '';
        for (let i = 0; i < secondCols.length; i += 1) {
          cell += `<p>${secondCols[i].textContent}</p>`;
        }
        block.push([`<strong>${row.querySelector('div.col-sm-4.col-md-3').textContent}</strong>`, cell]);
      } else if (row.querySelector('div.col-sm-4.col-md-3') && row.querySelector('div.col-sm-12 table')) {
        block.push([row.querySelector('div.col-sm-4.col-md-3').textContent, 'table']);
      } else if (row.querySelector('div.col-sm-4.col-md-3')) {
        block.push([row.querySelector('div.col-sm-4.col-md-3').textContent]);
      } else if (row.querySelector('div.col-xs-12 table')) {
        const tblLink = `https://main--airlessco--hlxsites.hlx.page/product-data/accessories/${productId.toLowerCase()}.json?sheet=${locale}`;
        block.push([`<a href="${tblLink}">${tblLink}</a>`]);
      } else if (row.querySelector('.table-responsive')) {
        const tblLink = `https://main--airlessco--hlxsites.hlx.page/product-data/accessories/${productId.toLowerCase()}.json?sheet=${locale}`;
        block.push([`<strong>${row.querySelector('div.col-sm-12.col-md-3').textContent}</strong>`,`<a href="${tblLink}">${tblLink}</a>`]);
      } else if (row.querySelector('div.col-xs-12')) {
        block.push([row.querySelector('div.col-xs-12').textContent]);
      }
    }
  });
  main.append(WebImporter.DOMUtils.createTable(block, document));
};

const createAccessorySections = (main, document, url) => {
  const sections = document.querySelectorAll('body > div.container.start > div.row, body > div.container.start > h2');

  Object.values(sections).every((el) => {
    if (el.nodeName.toLowerCase() !== 'div') {
      return false; // Stop at end of sections.
    }
    main.append(document.createElement('hr'));
    createImage(document, main, el);
    createAccessoriesDetailBlock(document, main, el, url);
    return true;
  });
};

const createMoreAccessoriesBlock = (main, document) => {
  main.append(document.createElement('hr'));
  const heading = document.querySelector('h2');
  const types = [];

  const links = heading.nextElementSibling.querySelectorAll('a');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    types.push(href.replace(/.*\/(revtip)?(\w+)\/?/, '<p>$2</p>'));
  });

  const table = [
    ['Accessories Category'],
    ['Title', `${heading.outerHTML}`],
    ['Types', types.join('')],
  ];
  const tbl = WebImporter.DOMUtils.createTable(table, document);
  main.append(tbl);
};

const addMetadata = (main, document) => {
  const last = document.querySelector('ol.breadcrumb li.active');
  const meta = main.querySelector('table:last-of-type');
  const tr = document.createElement('tr');
  let td = document.createElement('td');
  td.textContent = 'Nav Title';
  tr.append(td);
  td = document.createElement('td');
  td.textContent = last.textContent.replace(/\s*Accessories\s*/g, '');
  tr.append(td);
  meta.append(tr);
};

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({ document, url }) => {
    const main = document.createElement('main');
    createAutoBlock(main, document);
    createAccessorySections(main, document, url);
    createMoreAccessoriesBlock(main, document);
    createMetadataBlock(main, document, url);
    addMetadata(main, document);
    document.body.innerHTML = main.innerHTML;
    return document.body;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({ url }) => new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, ''),
};
