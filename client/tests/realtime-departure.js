const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const beacons = [], posts = [], retries = [];
let fail;
const context = {
  CloudFile: function() {},
  Class: () => {},
  AFN_VARS: {collab_uri: 'https://collab.example'},
  application: {controllers: {google_oauth: {current_user: {user_id: 'user', name: 'Name'}}}},
  navigator: {sendBeacon: (url, body) => { beacons.push({url, body}); return true; }},
  $: {post: (url, body) => { posts.push({url, body}); return {fail: callback => { fail = callback; }}; }},
  setTimeout: (callback, delay) => retries.push({callback, delay}),
  console: {error: () => {}}
};
vm.createContext(context);
for (const file of ['Model/CloudFile.js', 'Controller/Editor.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', file), 'utf8'), context);
}
const file = new context.CloudFile();
file.collab_id = 'document';
file._publisher_uuid = 'publisher';
const editor = Object.create(context.EditorController.prototype);
editor.realtime_document = file;
editor.publish_realtime_event({type: 'leaved'});
assert.equal(beacons.length, 1, 'departure must use a lifecycle-safe transport');
assert.equal(posts.length, 0);
assert.equal(retries.length, 0);
assert.equal(beacons[0].url, 'https://collab.example/api/collaboration/realtime_events/document');
assert.deepStrictEqual(JSON.parse(beacons[0].body), {
  type: 'leaved', google_user_id: 'user', google_user_name: 'Name', publisher_uuid: 'publisher'
});
for (const type of ['joined', 'ping', 'ace.js']) {
  editor.publish_realtime_event({type});
  assert.equal(JSON.parse(posts[posts.length - 1].body).type, type);
}
assert.equal(beacons.length, 1);
fail();
assert.equal(retries[0].delay, 1000);
retries[0].callback();
assert.equal(posts.length, 4, 'ordinary events retain retries');
editor.realtime_document = undefined;
editor.publish_realtime_event({type: 'leaved'});
assert.equal(beacons.length, 1, 'no departure without a collaborating document');
console.log('Realtime departure transport checks passed');
