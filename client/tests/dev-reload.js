const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {spawnSync} = require('child_process');

const compose = fs.readFileSync(path.join(__dirname, '..', '..', 'docker4dev', 'docker-compose.yaml'), 'utf8');
const clientService = compose.match(/^  client:\n([\s\S]*?)(?=^  webserver:)/m)[1];
assert.match(clientService, /^    init: true$/m, 'client needs an init process so idle sleep handles SIGTERM outside PID 1');

const build = fs.readFileSync(path.join(__dirname, '..', 'afn-app.sh'), 'utf8');
const entrypoint = build.slice(build.indexOf('\nbuild_all\n'), build.indexOf('\nfunction watch_dir()'));
for (const [mode, option, buildStatus, expectedStatus, expectedOutput] of [
  ['webdev', '--once', 0, 0, 'built\n'],
  ['webdev', '', 0, 0, 'built\nwatching\n'],
  ['', '', 0, 0, 'built\n'],
  ['webdev', '--once', 1, 1, 'built\n']
]) {
  const result = spawnSync('bash', ['-c', `
    set -e
    WEBDEV="$1"
    is_webdev() { [ "$WEBDEV" == "webdev" ]; }
    build_all() { echo built; return ${buildStatus}; }
    ${entrypoint}
    echo watching
  `, 'build-test', mode, option], {encoding: 'utf8'});
  assert.equal(result.status, expectedStatus, 'build exit status: ' + result.stderr);
  assert.equal(result.stdout, expectedOutput, 'only standalone webdev starts watching');
}

const renderCommand = build.match(/^  perl render\.pl .*$/m)[0];
const render = fs.readFileSync(path.join(__dirname, '..', 'render.pl'), 'utf8');
const options = render.slice(render.indexOf('my ($COMPILED_APP_DIR'), render.indexOf('my $tt'));
for (const mode of ['', 'webdev']) {
  const result = spawnSync('bash', ['-c', `
    perl() { command perl -MGetopt::Long -e "$PARSER" -- "\${@:2}"; }
    COMPILED_APP=/unused APP_VERSION_ID=test APP_VERSION=dyn APP_COMMIT_ID=test
    ${renderCommand}
  `], {encoding: 'utf8', env: {...process.env, WEBDEV: mode, PARSER: options + 'print $WEBDEV;'}});
  assert.equal(result.status, 0, 'render options must accept mode ' + JSON.stringify(mode) + ': ' + result.stderr);
  assert.equal(result.stdout, mode);
}

const template = fs.readFileSync(path.join(__dirname, '..', 'editor-layout.tt'), 'utf8');
const block = template.match(/\[% IF WEBDEV == 'webdev' %\]\s*<script>([\s\S]*?)<\/script>\s*\[% END %\]/);
assert(block, 'polling script must be gated on webdev');
const script = block[1].replace('[% APP_VERSION_ID %]', 'initial-build');
const timers = [], requests = [];
let reloads = 0;
const beforeunload = () => 'unsaved changes';
const context = {
  $: {ajax: options => requests.push(options), trim: text => text.trim()},
  setTimeout: (callback, delay) => timers.push({callback, delay}),
  window: {location: {reload: () => reloads++}, onbeforeunload: beforeunload}
};
vm.runInNewContext(script, context);

function nextRequest() {
  assert.equal(timers.length, 1, 'exactly one retry is scheduled');
  const timer = timers.shift();
  assert.equal(timer.delay, 1000);
  timer.callback();
  assert.equal(timers.length, 0, 'no retry until the request completes');
  assert.equal(requests.length, 1);
  const request = requests.shift();
  assert.equal(request.url, '/dev-build-id.txt');
  assert.equal(request.cache, false);
  assert.equal(request.dataType, 'text');
  assert(request.timeout > 0, 'requests must time out');
  return request;
}

for (const id of ['initial-build', '', '  \n', 'initial-build\n']) {
  const request = nextRequest();
  request.success(id);
  assert.equal(reloads, 0, 'unchanged or empty IDs do not reload');
  request.complete();
}
for (const status of ['error', 'timeout']) {
  const request = nextRequest();
  if (request.error) request.error({}, status);
  request.complete({}, status);
  assert.equal(reloads, 0, 'missing files and network failures do not reload');
}
for (const [id, expected] of [['second-build\n', 1], ['second-build', 1], ['', 1], ['third-build', 2], ['third-build', 2]]) {
  const request = nextRequest();
  request.success(id);
  assert.equal(reloads, expected, 'one attempt per observed build, even if navigation is cancelled');
  assert.strictEqual(context.window.onbeforeunload, beforeunload, 'unsaved-edit handler stays intact');
  assert.equal(timers.length, 0);
  request.complete();
}
assert.equal(timers.length, 1, 'polling continues after a cancelled reload');
console.log('Dev-reload checks passed');
