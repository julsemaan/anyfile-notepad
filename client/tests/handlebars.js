const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const clientDir = path.join(__dirname, '..');
const browser = {};
vm.runInNewContext(
  fs.readFileSync(path.join(clientDir, 'node_modules/handlebars/dist/handlebars.js'), 'utf8'),
  browser
);
const Handlebars = browser.Handlebars;
assert.strictEqual(Handlebars.VERSION, '4.7.9');
Handlebars.registerHelper('i18n', value => value);

function templateFrom(file, attribute) {
  const source = fs.readFileSync(path.join(clientDir, file), 'utf8');
  const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scripts.exec(source))) {
    if (match[1].includes(attribute)) return match[2];
  }
  throw new Error(`Template not found: ${file} ${attribute}`);
}

const sandbox = {
  DataBinder: function() {
    this.on = function() {};
    this.trigger = function() {};
  },
  $: { extend: Object.assign },
};
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(clientDir, 'assets/js/Model.js'), 'utf8'), sandbox);
sandbox.Model.prototype.inherited_secret = 'must not render';
sandbox.Model.prototype.inherited_method = function() { return 'must not render'; };

const model = new sandbox.Model({
  uid: 'popup',
  title: 'A title',
  popup_id: 'popup-1',
  popup_name: 'test',
  message: '<img src=x onerror=alert(1)>',
  confirm: false,
  ok_btn: true,
  confirm_id: 'confirm-1',
  confirm_btn: 'OK',
});

const modelOutput = Handlebars.compile('{{title}}|{{inherited_secret}}|{{inherited_method}}|{{constructor}}|{{__proto__}}')(model);
assert.strictEqual(modelOutput, 'A title||||');

const popupOutput = Handlebars.compile(templateFrom('_popup.html', 'id="popup-template"'))(model);
assert(popupOutput.includes('&lt;img src&#x3D;x onerror&#x3D;alert(1)&gt;'));
assert(!popupOutput.includes('<img'));

const flashOutput = Handlebars.compile(templateFrom('_flash.html', 'data-template-name="flash-message"'))({
  text: '<a href="/help">Trusted notice</a>',
  type: 'success',
  alert_id: 'flash-1',
});
assert(flashOutput.includes('<a href="/help">Trusted notice</a>'));

console.log('Handlebars rendering check passed');
