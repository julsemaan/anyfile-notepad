#!/usr/bin/env node

'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

function readSource(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

var template = readSource('print.tt');
var editor = readSource('assets/js/Controller/Editor.js');

assert.ok(template.indexOf("<a id=\"print\" href=\"#print\" class=\"btn btn-primary\">Print</a>") !== -1);
assert.ok(template.indexOf("<label for=\"line_numbers_checkbox\">Line numbers : </label>") !== -1);
assert.ok(template.indexOf("<pre class=\"with_line_numbers hide\"></pre>") !== -1);
assert.ok(template.indexOf("<pre class=\"without_line_numbers\"></pre>") !== -1);
assert.ok(template.indexOf("document.getElementById('print').addEventListener('click'") !== -1);
assert.ok(template.indexOf("document.getElementById('line_numbers_checkbox')") !== -1);
assert.ok(template.indexOf("addEventListener('change'") !== -1);
assert.ok(template.indexOf('line_numbers_checkbox.checked') !== -1);
assert.ok(template.indexOf(".without_line_numbers').classList.add('hide')") !== -1);
assert.ok(template.indexOf(".without_line_numbers').classList.remove('hide')") !== -1);
assert.ok(template.indexOf(".with_line_numbers').classList.add('hide')") !== -1);
assert.ok(template.indexOf(".with_line_numbers').classList.remove('hide')") !== -1);
assert.ok(template.indexOf('line_numbers_on') === -1);
assert.ok(template.indexOf('$') === -1);
assert.ok(template.indexOf('window.print()') !== -1);

assert.ok(editor.indexOf('jquery-1.11.3.min.js') === -1);
assert.ok(editor.indexOf('var myWindow = window.open("", "MsgWindow", "width=800, height=600");') !== -1);
assert.ok(editor.indexOf("$('#print_content .with_line_numbers').text(numbered_text);") !== -1);
assert.ok(editor.indexOf("$('#print_content .without_line_numbers').text(this.editor_view.getValue());") !== -1);
assert.ok(editor.indexOf("myWindow.document.write($('#print_content').html());") !== -1);

console.log('print source check passed');
