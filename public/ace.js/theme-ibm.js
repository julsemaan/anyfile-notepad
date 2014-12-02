define("ace/theme/ibm",["require","exports","module","ace/lib/dom"], function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-ibm";
exports.cssText = ".ace-ibm .ace_gutter,\
.ace-ibm .ace_gutter {\
background: black;\
color: #66FF33\
}\
.ace-ibm .ace_print-margin {\
width: 1px;\
background: black\
}\
.ace-ibm {\
background-color: black;\
color: #66FF33\
}\
.ace-ibm .ace_cursor {\
color: #66FF33\
}\
.ace-ibm .ace_marker-layer .ace_active-line,\
.ace-ibm .ace_marker-layer .ace_selection {\
background: #191919\
}\
.ace-ibm.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px white;\
border-radius: 2px\
}\
.ace-ibm .ace_marker-layer .ace_step {\
background: black\
}\
.ace-ibm .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #66FF33\
}\
.ace-ibm .ace_gutter-active-line {\
background-color: #191919\
}\
.ace-ibm .ace_marker-layer .ace_selected-word {\
border: 1px solid #66FF33\
}\
.ace-ibm .ace_fold {\
background-color: black;\
border-color: #66FF33\
}\
.ace-ibm .ace_constant.ace_character.ace_escape,\
.ace-ibm .ace_keyword.ace_operator,\
.ace-ibm .ace_meta.ace_selector,\
.ace-ibm .ace_string.ace_regexp {\
color: #66FF33\
}\
.ace-ibm .ace_constant,\
.ace-ibm .ace_keyword.ace_other.ace_unit {\
color: #66FF33\
}\
.ace-ibm .ace_comment,\
.ace-ibm .ace_constant.ace_character,\
.ace-ibm .ace_constant.ace_language,\
.ace-ibm .ace_constant.ace_numeric,\
.ace-ibm .ace_constant.ace_other,\
.ace-ibm .ace_keyword,\
.ace-ibm .ace_string,\
.ace-ibm .ace_support.ace_constant,\
.ace-ibm .ace_support.ace_function,\
.ace-ibm .ace_variable {\
color: #66FF33\
}\
.ace-ibm .ace_invalid.ace_illegal {\
color: #66FF33;\
background-color: black\
}\
.ace-ibm .ace_storage.ace_type,\
.ace-ibm .ace_support.ace_class,\
.ace-ibm .ace_support.ace_type,\
.ace-ibm .ace_variable.ace_parameter {\
font-style: italic;\
color: #66FF33\
}\
.ace-ibm .ace_entity.ace_name.ace_tag,\
.ace-ibm .ace_storage {\
color: #66FF33\
}\
.ace-ibm .ace_markup.ace_list {\
color: #66FF33\
}\
.ace-ibm .ace_invalid {\
color: #66FF33;\
background-color: black\
}\
.ace-ibm .ace_invalid.ace_deprecated {\
color: #66FF33;\
background-color: black\
}\
.ace-ibm .ace_entity.ace_name.ace_function,\
.ace-ibm .ace_entity.ace_other.ace_attribute-name {\
color: #66FF33\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
