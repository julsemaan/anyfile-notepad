const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const client = path.join(__dirname, '..');
assert.strictEqual(require('../node_modules/jquery/package.json').version, '3.7.1');
assert.strictEqual(require('../node_modules/bootstrap/package.json').version, '3.4.1');
const requests = [], retries = [], delivered = [];
const context = {
  Class: name => { context[name] = function() {}; },
  AFN_VARS: {collab_uri: 'https://collab.example'},
  $: {get: (url, args) => {
    const request = {url, args};
    requests.push(request);
    // jQuery 3 jqXHR has done/fail, but no success method.
    request.done = callback => { request.resolve = callback; return request; };
    request.fail = callback => { request.reject = callback; return request; };
    return request;
  }},
  setTimeout: (callback, delay) => retries.push({callback, delay}),
  console: {error: () => {}}
};
vm.createContext(context);
for (const file of ['Controller/Flash.js', 'Model/CloudFile.js']) {
  vm.runInContext(fs.readFileSync(path.join(client, 'assets/js', file), 'utf8'), context);
}
const flash = new context.FlashController();
flash.set = (key, value) => { flash[key] = value; };
for (const [dynamic, sticky] of [[0, 0], [2, 3], [0, 1]]) {
  flash.dynamic_flash = {children: () => ({length: dynamic})};
  flash.sticky_flash = {children: () => ({length: sticky})};
  flash.update_count();
  assert.strictEqual(flash.count, dynamic + sticky);
}
const file = new context.CloudFile();
file.collab_id = 'document';
file._publisher_uuid = 'self';
file.start_realtime_events(event => delivered.push(event));
assert.strictEqual(requests.length, 0, 'unsaved files do not poll');
file.id = 'saved-file';
file.modified_timestamp = 100;
file.start_realtime_events(event => delivered.push(event));
assert.strictEqual(requests[0].url, 'https://collab.example/api/collaboration/realtime_events');
assert.strictEqual(requests[0].args.category, 'document');
assert.strictEqual(requests[0].args.timeout, 30);
assert.strictEqual(requests[0].args.since_time, 100);
const other = {timestamp: 110, data: {publisher_uuid: 'other', type: 'ace.js'}};
requests[0].resolve({events: [other, {timestamp: 120, data: {publisher_uuid: 'self'}}]});
assert.deepStrictEqual(delivered, [other], 'own events must not be rebroadcast');
assert.strictEqual(requests[1].args.since_time, 120, 'cursor advances past all events');
requests[1].reject();
assert.strictEqual(retries[0].delay, 1000);
retries[0].callback();
assert.strictEqual(requests[2].args.since_time, 120, 'retry preserves cursor');
requests[2].resolve({});
assert.strictEqual(requests.length, 4, 'empty responses continue polling');
file._run_realtime = false;
requests[3].resolve({events: [other]});
requests[3].reject();
assert.strictEqual(requests.length, 4, 'disabled polling does not restart');
assert.strictEqual(delivered.length, 1);
assert.strictEqual(retries.length, 1);
const cancelPage = fs.readFileSync(path.join(client, '../pages/email-cancel.markdown'), 'utf8');
const cancelScript = cancelPage.match(/<script>([\s\S]*?)<\/script>/)[1];
const failureMessage = 'There was an error canceling your subscription. Please contact support@semaan.ca via email to cancel this subscription.';
for (const [method, response, resultClass, message] of [
  ['resolve', {message: 'Cancelled'}, 'alert-success', 'Cancelled'],
  ['reject', {status: 400, responseJSON: {message: 'Already cancelled'}}, 'alert-warning', 'Already cancelled'],
  ['reject', {status: 500, responseJSON: {message: 'Server error'}}, 'alert-danger', failureMessage]
]) {
  const button = {
    on: (event, callback) => { assert.strictEqual(event, 'click'); button.click = callback; },
    hide: () => { button.hidden = true; }
  };
  const result = {
    addClass: value => { result.className = value; },
    html: value => { result.message = value; }
  };
  const $ = selector => {
    assert.ok(selector === '#unsubscribe' || selector === '#result');
    return selector === '#unsubscribe' ? button : result;
  };
  const request = {
    done: callback => { request.resolve = callback; return request; },
    fail: callback => { request.reject = callback; return request; }
  };
  $.post = url => {
    assert.strictEqual(url, '/api/billing/link_cancel/customer/link');
    return request;
  };
  vm.runInNewContext(cancelScript, {
    $, window: {location: {href: 'https://example.com/email-cancel?cus_id=customer&cancel_link_id=link'}}
  });
  button.click();
  assert.strictEqual(typeof request.resolve, 'function');
  assert.strictEqual(typeof request.reject, 'function');
  request[method](response);
  assert.strictEqual(button.hidden, true);
  assert.strictEqual(result.className, resultClass);
  assert.strictEqual(result.message, message);
}
console.log('jQuery compatibility checks passed');
