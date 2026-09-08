#!/usr/bin/env python3
"""Check the committed client dependency and browser-input baseline."""

import hashlib
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


def main():
    try:
        package = json.loads(read("package.json"))
        lock = json.loads(read("package-lock.json"))
        bower = json.loads(read("bower.json"))
        minify_conf = json.loads(read(".minify.json"))
    except (OSError, ValueError) as error:
        print("FAIL: unable to read manifests: {}".format(error))
        return 1

    expected_npm = {
        "dropbox": "<3.0.0",
        "handlebars": "4.7.9",
        "tether-shepherd": "^1.8.1",
    }
    expected_dev_npm = {
        "bower": "1.8.14",
        "sass": "1.104.0",
        "minify": "15.3.1",
    }
    check(
        package.get("dependencies", {}) == expected_npm,
        "package.json dependency set changed",
    )
    check(
        package.get("devDependencies", {}) == expected_dev_npm,
        "package.json devDependency set changed",
    )
    for section in ("optionalDependencies", "peerDependencies"):
        check(section not in package, "package.json {} must stay absent".format(section))
    for name, declaration in expected_npm.items():
        check(
            package.get("dependencies", {}).get(name) == declaration,
            "package.json declaration changed for {}".format(name),
        )
    for name, declaration in expected_dev_npm.items():
        check(
            package.get("devDependencies", {}).get(name) == declaration,
            "package.json declaration changed for {}".format(name),
        )

    root = lock.get("packages", {}).get("", {})
    check(
        root.get("dependencies", {}) == expected_npm,
        "package-lock root dependencies changed",
    )
    check(
        root.get("devDependencies", {}) == expected_dev_npm,
        "package-lock root devDependencies changed",
    )

    check(lock.get("lockfileVersion") == 3, "package-lock is not lockfile version 3")
    check(
        hashlib.sha256((CLIENT / "package-lock.json").read_bytes()).hexdigest()
        == "97d20f7ed8b12b1a27185113b3de3cbbcde650c87c83c6b1d7f4b9cf17ddc3de",
        "package-lock SHA-256 digest changed",
    )
    check(
        len(lock.get("packages", {})) == 245,
        "package-lock package count is not 245",
    )
    expected_lock = {
        "node_modules/dropbox": "2.5.13",
        "node_modules/handlebars": "4.7.9",
        "node_modules/tether-shepherd": "1.8.1",
        "node_modules/bower": "1.8.14",
        "node_modules/sass": "1.104.0",
        "node_modules/minify": "15.3.1",
    }
    for name, version in expected_lock.items():
        entry = lock.get("packages", {}).get(name, {})
        check(
            entry.get("version") == version,
            "package-lock resolution changed for {}".format(name),
        )

    expected_bower = {
        "ace-anyfile-notepad": "https://github.com/julsemaan/ace.git#29c744e292c7fd20c8283ed528b9c12b6174a83d",
        "bootstrap": "3.1.1",
        "jquery-ui": "~1.11",
        "jquery": "~1.11",
    }
    check(
        bower.get("dependencies") == expected_bower,
        "bower dependency declarations changed",
    )
    check("devDependencies" not in bower, "bower devDependencies must stay absent")
    check("resolutions" not in bower, "bower resolutions must stay absent")

    for path in (
        "afn-app.sh",
        "render.pl",
        "editor-layout.tt",
        "site/layout.tt",
        ".minify.json",
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
        "add_css_asset bower_components/bootstrap/dist/css/bootstrap.min.css $APPLICATION_CSS",
        "cp bower_components/bootstrap/dist/css/bootstrap.min.css assets/css/libs/bootstrap.min.css.scss",
        "add_css_asset node_modules/tether-shepherd/dist/css/shepherd-theme-default.css $APPLICATION_CSS",
        "add_css_asset public/jqueryFileTree/jqueryFileTree.css $APPLICATION_CSS",
        "sass --no-source-map --load-path assets/css/ assets/css/pages.css.scss",
        "sass --no-source-map --load-path assets/css/ assets/css/editor.css.scss",
        "node_modules/dropbox/dist/Dropbox-sdk.min.js",
        "bower_components/jquery/dist/jquery.min.js",
        "bower_components/jquery-ui/jquery-ui.min.js",
        "bower_components/bootstrap/dist/js/bootstrap.min.js",
        "node_modules/tether-shepherd/dist/js/tether.js",
        "node_modules/tether-shepherd/dist/js/shepherd.min.js",
        "public/jqueryFileTree/jqueryFileTree.js",
        "public/jquery.cookie.min.js",
        "node_modules/handlebars/dist/handlebars.js",
        "find assets/js/ -name '*.js'",
        "sass --no-source-map --load-path",
        "--fail-on-error",
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

    check(
        not (CLIENT / "assets/css/common.css.scss").is_file(),
        "assets/css/common.css.scss must stay absent",
    )
    check(
        not (CLIENT / "assets/js/libs/handlebars.js").is_file(),
        "assets/js/libs/handlebars.js must stay absent",
    )
    editor_css = read("assets/css/editor.css.scss")
    check(
        '@use "libs/bundled-material.min.css.scss"' in editor_css,
        "editor CSS material import changed",
    )
    check("@" + "import" not in editor_css, "editor CSS still uses @import")
    check(
        "a.for_menu_header.menu_back" in editor_css,
        "editor CSS menu size fix missing",
    )
    check(
        "rgba(#000000, 0.26)" in editor_css,
        "editor CSS disabled syntax color changed",
    )
    pages_css = read("assets/css/pages.css.scss")
    check(
        '@use "libs/bootstrap.min.css.scss"' in pages_css,
        "pages CSS bootstrap import changed",
    )
    check(
        '@use "libs/bundled-material.min.css.scss"' in pages_css,
        "pages CSS material import changed",
    )
    check("@" + "import" not in pages_css, "pages CSS still uses @import")
    check(".flash_notice" in pages_css, "pages CSS flash styles missing")
    check(".footer_menu" in pages_css, "pages CSS footer styles missing")
    check(
        "sass --no-source-map --load-path assets/css/ assets/css/pages.css.scss" in build,
        "pages sass invocation changed",
    )
    check(
        "sass --no-source-map --load-path assets/css/ assets/css/editor.css.scss" in build,
        "editor sass invocation changed",
    )
    check(
        'minify "$APPLICATION_CSS" --fail-on-error' in build,
        "css minify invocation changed",
    )
    check(
        'minify "$APPLICATION_JS" --fail-on-error' in build,
        "js minify invocation changed",
    )
    check(
        minify_conf.get("css", {}).get("type") == "clean-css",
        ".minify.json css type changed",
    )
    check(
        minify_conf.get("js", {}).get("type") == "terser",
        ".minify.json js type changed",
    )

    if failures:
        print("FAIL: client baseline source check")
        for failure in failures:
            print("- {}".format(failure))
        return 1

    print("PASS: client baseline source check ({} checks)".format(checks))
    return 0


if __name__ == "__main__":
    sys.exit(main())
