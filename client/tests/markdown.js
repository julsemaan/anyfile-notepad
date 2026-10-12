const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const clientDir = path.join(__dirname, '..');
const rootDir = path.join(clientDir, '..');
const browser = {};
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(clientDir, 'node_modules/marked/package.json'))).version, '18.1.1');
vm.runInNewContext(fs.readFileSync(path.join(clientDir, 'node_modules/marked/lib/marked.umd.js'), 'utf8'), browser);

// Only model the jQuery operations used by MDRenderer, without executing page scripts.
function Element(source) {
  this.source = source;
  this.content = '';
  this.children = [];
}
Element.prototype.html = function(value) {
  if (value !== undefined) this.content = value;
  return this;
};
Element.prototype.append = function(value) {
  this.children.push(value);
  return this;
};
Element.prototype.output = function() {
  return this.source + this.content + this.children.map(child => typeof child === 'string' ? child : child.output()).join('');
};
browser.$ = source => new Element(source);
browser.Model = function(data) { Object.assign(this, data); };
vm.runInNewContext(fs.readFileSync(path.join(clientDir, 'assets/js/MDRenderer.js'), 'utf8'), browser);

function renderer(text, columns = 1) {
  const result = Object.create(browser.MDRenderer.prototype);
  result.columns = columns;
  result.elements = result.parse(text);
  return result;
}

const example = renderer(`# Notice *now*

## A **title** and [link](/title)

An *inline* **paragraph** with [link][help] and \`code\`.

### Body heading

- First
- Second

1. Ordered
2. List

\`\`\`js
const value = "<tag>";
\`\`\`

<div id="trusted">Raw HTML</div>

<script>window.firstParty = true;</script>

<!--- end panel -->

## Second

Next panel.

<!--- end panel -->

[help]: /help
`);
const panels = example.createPanels();
assert.strictEqual(panels.length, 3);
assert(panels[0].output().includes('Notice <em>now</em>'));
assert(panels[1].children[0].output().includes('A <strong>title</strong> and <a href="/title">link</a>'));
const body = panels[1].children[1].output();
for (const html of ['<em>inline</em>', '<strong>paragraph</strong>', '<a href="/help">link</a>', '<code>code</code>', '<h3>Body heading</h3>', '<ul>', '<ol>', '<li>First</li>', '<pre><code class="language-js">', '&lt;tag&gt;', '<div id="trusted">Raw HTML</div>', '<script>window.firstParty = true;</script>']) {
  assert(body.includes(html), html);
}
assert(!body.includes('<!--- end panel -->'));
assert(panels[2].output().includes('Next panel.'));

// Only the exact standalone delimiter ends a panel, never ordinary comments or code.
const delimiters = renderer('## Exact\n\n<!-- end panel -->\n\n<!--- end panel --> extra\n\n```\n<!--- end panel -->\n```\n\n<!--- end panel -->\n');
assert.strictEqual(delimiters.createPanels().length, 1);
assert(delimiters.createPanels()[0].output().includes('<!-- end panel -->'));
assert(delimiters.createPanels()[0].output().includes('<!--- end panel --> extra'));
assert(delimiters.createPanels()[0].output().includes('&lt;!--- end panel --&gt;'));
assert.strictEqual(renderer('## EOF\n\nBody\n\n<!--- end panel -->').createPanels().length, 1);
assert.strictEqual(renderer('## No delimiter\n\nBody\n').createPanels().length, 0);

for (const count of [1, 4, 5, 6, 10]) {
  for (const columns of [1, 2, 3]) {
    const text = Array.from({ length: count }, (_, i) => `## Panel ${i}\n\nBody ${i}\n\n<!--- end panel -->\n`).join('\n');
    const grid = renderer(text, columns).createGrid();
    assert.strictEqual(grid.children.length, columns, `${count} panels in ${columns} columns`);
    assert(grid.children.every(column => column.source.includes(`col-md-${12 / columns}`)));
    const sizes = grid.children.map(column => column.children.length);
    assert(Math.max(...sizes) - Math.min(...sizes) <= 1, 'columns remain balanced');
    const actualPanels = grid.children.flatMap(column => column.children).filter(panel => panel.source.includes('panel-primary'));
    assert.strictEqual(actualPanels.length, count);
    actualPanels.forEach((panel, i) => assert(panel.children[0].output().includes(`Panel ${i}`)));
  }
}

// Exercise the committed first-party pages, not build output or downloaded resources.
const pages = execFileSync('git', ['ls-files', 'pages/*.markdown'], { cwd: rootDir, encoding: 'utf8' }).trim().split('\n');
for (const file of pages) {
  const text = execFileSync('git', ['show', `HEAD:${file}`], { cwd: rootDir, encoding: 'utf8' });
  const pagePanels = renderer(text).createPanels();
  const count = (text.match(/^<!--- end panel -->$/gm) || []).length;
  assert.strictEqual(pagePanels.filter(panel => panel.source.includes('panel-primary')).length, count, file);
  const output = pagePanels.map(panel => panel.output()).join('');
  assert(!output.includes('<!--- end panel -->'), file);
  for (const match of text.matchAll(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g)) {
    assert(output.includes(match[0]), `${file} preserves ${match[1]}`);
  }
}
console.log(`Markdown rendering check passed, including ${pages.length} committed pages`);
