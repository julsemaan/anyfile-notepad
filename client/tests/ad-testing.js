const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');

function harness(cookie, protocol = 'https:') {
  const popups = [], writes = [], flashes = [];
  let reloads = 0;
  const document = {};
  Object.defineProperty(document, 'cookie', {
    get: () => cookie,
    set: value => {
      writes.push(value);
      cookie = value.includes('Max-Age=0') ? '' : 'AFNForceAds=1';
    }
  });
  const beforeunload = () => 'unsaved changes';
  const context = {
    document,
    window: {location: {protocol, reload: () => reloads++}, onbeforeunload: beforeunload},
    Popup: function(options) { popups.push(options); },
    i18n: text => text,
    TourController: function() {},
    StatIncrement: {record: () => {}},
    $: () => ({is: () => true})
  };
  vm.createContext(context);
  const helpers = fs.readFileSync(path.join(root, 'assets/js/helpers.js'), 'utf8');
  vm.runInContext(helpers.slice(0, helpers.indexOf('function setCookie')), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/Controller/Application.js'), 'utf8'), context);
  const app = new context.ApplicationController();
  app.controllers.editor = {flash: {sticky_warning: (text, options) => flashes.push({text, options})}};
  context.application = app;
  return {app, context, popups, writes, flashes, beforeunload, reloads: () => reloads};
}

const about = fs.readFileSync(path.join(root, '_about.html'), 'utf8');
const control = about.match(/<(button|a)\b[^>]*onclick="([^"]+)"[^>]*>.*?build_id.*?<\/(?:button|a)>/);
assert(control, 'Build ID must be a focusable control');
const h = harness('');
h.context.event = {shiftKey: false};
vm.runInContext(control[2], h.context);
assert.equal(h.popups.length, 0, 'normal clicks do nothing');
h.context.event = {shiftKey: true};
vm.runInContext(control[2], h.context);
assert.equal(h.popups.length, 1);
assert.equal(h.popups[0].confirm, true);
h.popups[0].callback(false);
assert.equal(h.writes.length, 0);
assert.equal(h.reloads(), 0);
h.popups[0].callback(true);
assert.equal(h.writes[0], 'AFNForceAds=1; Path=/; SameSite=Lax; Max-Age=31536000; Secure');
assert.equal(h.reloads(), 1);
assert.strictEqual(h.context.window.onbeforeunload, h.beforeunload);

for (const protocol of ['https:', 'http:']) {
  const active = harness('other=1; AFNForceAds=1', protocol);
  assert.equal(active.writes.length, 1, 'refresh active cookie on app load');
  assert.equal(active.writes[0].includes('; Secure'), protocol === 'https:');
  active.app.setupAdTestingFlash();
  assert.equal(active.flashes.length, 1);
  assert.equal(active.flashes[0].options, undefined, 'reminder has no permanent dismissal ID');
  assert(active.flashes[0].text.includes('Ad testing is enabled.'));
  const link = active.flashes[0].text.match(/onclick='([^']+)'/);
  assert(link, 'reminder must have a disable link');
  vm.runInContext(link[1], active.context);
  active.popups[0].callback(false);
  assert.equal(active.writes.length, 1);
  assert.equal(active.reloads(), 0);
  active.popups[0].callback(true);
  assert.equal(active.writes[1], 'AFNForceAds=; Path=/; SameSite=Lax; Max-Age=0' + (protocol === 'https:' ? '; Secure' : ''));
  assert.equal(active.reloads(), 1);
  assert.strictEqual(active.context.window.onbeforeunload, active.beforeunload);
}
for (const cookie of ['', 'AFNForceAds=0', 'AFNForceAds=true']) {
  const inactive = harness(cookie);
  inactive.app.setupAdTestingFlash();
  assert.equal(inactive.writes.length, 0);
  assert.equal(inactive.flashes.length, 0);
}
const main = fs.readFileSync(path.join(root, 'assets/js/app-main.js.tt'), 'utf8');
assert(main.indexOf('application.setupAdTestingFlash()') > main.indexOf('editor_controller.initialize_html()'));
console.log('Ad-testing checks passed');
