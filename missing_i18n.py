import json
import os
import operator
import re
import sys

process = os.popen("make extract-i18n-strings")
strings = process.read()
process.close()

if len(sys.argv) > 1:
    locale_file = open("client/locales/_"+sys.argv[1]+".json")
    locale_json = locale_file.read()
    locale = json.loads(locale_json)
else:
    locale = {}

strings_array = strings.split("\n")
del strings_array[0]

missing = {}

skip_patterns = [
    re.compile("\<\%.*%\>"),
    re.compile("^rep -r")
]

non_extractable_strings = [
    "\"Skip\"",
    "\"Restart app\"",
    "\"Authorize!\"",
]

strings_array += non_extractable_strings

for string in strings_array:
    stripped = string[1:-1]
    skip = False

    for skip_pattern in skip_patterns:
        if skip_pattern.match(stripped):
            skip = True

    if not skip and not stripped in locale:
        missing[stripped] = ""

print json.dumps(missing, sort_keys=True, indent=2, separators=(',', ': '))
