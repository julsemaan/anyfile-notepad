import json
import os
import operator
import re
import sys

# change directory to where the script is hosted
zidir = os.path.dirname(os.path.realpath(__file__))
os.chdir(zidir)
process = os.popen("cd "+zidir+" && make extract-i18n-strings")
strings = process.read()
process.close()

if len(sys.argv) > 1:
    locale_file = open("locales/_"+sys.argv[1]+".json")
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

skip_strings = [
    ".*?",
]

non_extractable_strings = [
    "Skip",
    "Restart app",
    "Authorize!",
]

strings_array += ['"'+s+'"' for s in non_extractable_strings]

for string in strings_array:
    stripped = string[1:-1]
    skip = False

    for skip_pattern in skip_patterns:
        if skip_pattern.match(stripped):
            skip = True

    if stripped in skip_strings:
        skip = True

    if not skip and not stripped in locale:
        missing[stripped] = ""

print json.dumps(missing, sort_keys=True, indent=2, separators=(',', ': '))
