#!/usr/bin/env python3
"""Check the committed client dependency and browser-input baseline."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLIENT = ROOT / "client"
failures = []
checks = 0


def check(condition, message):
    global checks
    checks += 1
    if not condition:
        failures.append(message)


def read(path):
    return (CLIENT / path).read_text(encoding="utf-8")


def lock_entry_count(dependencies):
    return len(dependencies) + sum(
        lock_entry_count(entry.get("dependencies", {}))
        for entry in dependencies.values()
    )


def main():
    try:
        package = json.loads(read("package.json"))
        lock = json.loads(read("package-lock.json"))
        bower = json.loads(read("bower.json"))
    except (OSError, ValueError) as error:
        print("FAIL: unable to read manifests: {}".format(error))
        return 1

    expected_npm = {
        "bower": (">0.0.0", "1.8.8"),
        "dropbox": ("<3.0.0", "2.5.13"),
        "minify": ("2.1.8", "2.1.8"),
        "node-sass": (">0.0.0", "4.14.1"),
        "tether-shepherd": ("^1.8.1", "1.8.1"),
    }
    check(
        set(package.get("dependencies", {})) == set(expected_npm),
        "package.json dependency set changed",
    )
    for name, (declaration, version) in expected_npm.items():
        check(
            package.get("dependencies", {}).get(name) == declaration,
            "package.json declaration changed for {}".format(name),
        )
        entry = lock.get("dependencies", {}).get(name, {})
        check(
            entry.get("version") == version,
            "package-lock resolution changed for {}".format(name),
        )

    check(lock.get("lockfileVersion") == 1, "package-lock is not lockfile version 1")
    check(
        len(lock.get("dependencies", {})) == 252,
        "package-lock top-level entry count is not 252",
    )
    check(
        lock_entry_count(lock.get("dependencies", {})) == 292,
        "package-lock physical entry count is not 292",
    )

    expected_bower = {
        "ace-anyfile-notepad": "anyfile-notepad-v1.3.3",
        "bootstrap": "3.1.1",
        "jquery-ui": "~1.11",
        "jquery": "~1.11",
    }
    check(
        bower.get("dependencies") == expected_bower,
        "bower dependency declarations changed",
    )

    for path in (
        "afn-app.sh",
        "render.pl",
        "editor-layout.tt",
        "site/layout.tt",
        "assets/js/libs/handlebars.js",
        "assets/js/libs/rsvp.min.js",
        "assets/js/libs/route-recognizer.js",
        "public/jquery.cookie.min.js",
        "public/jqueryFileTree/jqueryFileTree.js",
        "public/jqueryFileTree/jqueryFileTree.css",
        "public/marked.js",
        "public/sw.js",
    ):
        check((CLIENT / path).is_file(), "missing committed input: {}".format(path))

    build = read("afn-app.sh")
    for path in (
        "node_modules/dropbox/dist/Dropbox-sdk.min.js",
        "bower_components/jquery/dist/jquery.min.js",
        "bower_components/jquery-ui/jquery-ui.min.js",
        "bower_components/bootstrap/dist/js/bootstrap.min.js",
        "node_modules/tether-shepherd/dist/js/tether.js",
        "node_modules/tether-shepherd/dist/js/shepherd.min.js",
        "public/jqueryFileTree/jqueryFileTree.js",
        "public/jquery.cookie.min.js",
        "find assets/js/ -name '*.js'",
        "node-sass",
        "./node_modules/.bin/minify",
        "bower_components/ace-anyfile-notepad/afn-dist/",
    ):
        check(path in build, "build input is not recorded: {}".format(path))

    render = read("render.pl")
    check(
        "WITH_ADS => 1}, $COMPILED_APP_DIR.'/app.html'" in render,
        "ads app variant is not rendered",
    )
    check(
        "WITH_ADS => 0}, $COMPILED_APP_DIR.'/app-plus-plus.html'" in render,
        "ad-free app variant is not rendered",
    )

    version_markers = {
        "assets/js/libs/handlebars.js": "handlebars v4.0.5",
        "assets/js/libs/rsvp.min.js": "@version   3.1.0",
        "assets/js/libs/route-recognizer.js": "VERSION = '0.1.9'",
        "public/jquery.cookie.min.js": "jQuery Cookie Plugin v1.4.0",
        "public/jqueryFileTree/jqueryFileTree.js": "Version 1.01",
    }
    for path, marker in version_markers.items():
        check(marker in read(path), "version marker missing: {}".format(path))

    external_loads = {
        "afn-app.sh": (
            "https://api.anyfile-notepad.semaan.ca/extensions",
            "https://api.anyfile-notepad.semaan.ca/syntaxes",
            "https://api.anyfile-notepad.semaan.ca/mime_types",
        ),
        "editor-layout.tt": (
            "//fonts.googleapis.com/icon?family=Material+Icons",
            "//www.googletagservices.com/tag/js/gpt.js",
            "https://storage.googleapis.com/dbmtiqbxqoopp7t3s9lq/sdbmtiqbxqoopp7t3s9lq.js",
            "https://storage.googleapis.com/dbmtiqbxqoopp7t3s9lq/vdbmtiqbxqoopp7t3s9lq.js",
            "https://apis.google.com/js/client.js?onload=gapi_loaded",
            "https://accounts.google.com/gsi/client",
        ),
        "analytics.tt": ("//www.google-analytics.com/analytics.js",),
        "app.tt": (
            "https://parchmentuniquevista.com/17133d254dc58db1395ab65191071264/invoke.js",
            "//resources.infolinks.com/js/infolinks_main.js",
        ),
        "_upgrade.html": ("https://checkout.stripe.com/checkout.js",),
        "assets/js/Controller/Editor.js": (
            "https://code.jquery.com/jquery-1.11.3.min.js",
        ),
        "public/sw.js": (
            "https://luckypushh.com/ntfc.php?p=1621486&r=sw",
        ),
        "site/site-content.tt": (
            "https://pages.anyfile-notepad.semaan.ca",
        ),
    }
    for path, loads in external_loads.items():
        source = read(path)
        for load in loads:
            check(load in source, "external load is not recorded: {}".format(load))

    if failures:
        print("FAIL: client baseline source check")
        for failure in failures:
            print("- {}".format(failure))
        return 1

    print("PASS: client baseline source check ({} checks)".format(checks))
    return 0


if __name__ == "__main__":
    sys.exit(main())
