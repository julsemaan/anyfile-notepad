const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const handlers = {};
const published = [];
const element = {
  find: () => element,
  css: () => element,
  height: () => 0,
  width: () => 800,
  attr: () => '0',
  resize: () => {},
  keypress: () => {},
  bind: (event, handler) => { handlers[event] = handler; },
  on: () => {}
};
const context = {
  window: {},
  $: () => element,
  BooleanPreference: {find: () => ({getValue: () => true})},
  i18n: text => text,
  setTimeout: () => {}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/Controller/Editor.js'), 'utf8'), context);
const editor = Object.create(context.EditorController.prototype);
Object.assign(editor, {
  $: element,
  $editor: element,
  major_notice_pref: {getValue: () => 0},
  editor_view: {
    on: () => {},
    getSession: () => ({selection: {on: () => {}}})
  },
  publish_realtime_event: event => published.push(event.type),
  safe_to_quit: true,
  file: {did_content_change: () => true}
});
editor.initialize_html();

const warning = 'You have unsaved changes or your file is still being saved. You will lose your changes';
assert.strictEqual(handlers.beforeunload(), warning);
assert.deepStrictEqual(published, [], 'cancelled navigation must not publish a departure');
editor.file.did_content_change = () => false;
editor.safe_to_quit = false;
assert.strictEqual(handlers.beforeunload(), warning, 'pending saves must still warn');
assert.deepStrictEqual(published, []);
editor.safe_to_quit = true;
assert.strictEqual(handlers.beforeunload(), undefined, 'saved files need no warning');
assert.deepStrictEqual(published, [], 'beforeunload must never publish a departure');
assert.strictEqual(typeof handlers.pagehide, 'function');
handlers.pagehide();
assert.deepStrictEqual(published, ['leaved'], 'committed navigation must publish a departure');
console.log('Editor unload checks passed');
