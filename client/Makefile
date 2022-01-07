
ghcr.io/julsemaan/anyfile-notepad/client/builder:
	docker run -v `pwd`/../docker4dev/config.json:/kaniko/.docker/config.json:ro -v `pwd`:/workspace gcr.io/kaniko-project/executor:latest --cache=true --dockerfile Dockerfile --destination "ghcr.io/julsemaan/anyfile-notepad/client:latest" --context dir:///workspace/

.PHONY : extract-i18n-strings

extract-i18n-strings:
	grep -roP 'i18n.".*?"' ./ | grep -oP '".*"' | sort -h | uniq
	grep -roP "i18n.'.*?'" ./ | grep -oP "'.*'" | sort -h | uniq
	grep -r 'modal' ./ | grep -oP 'title\s*=\s*".*?"' | grep -oP '".*"'
	grep -r 'modal' ./ | grep -oP 'message\s*=\s*".*?"' | grep -oP '".*"'

.PHONY : tx-push

tx-push:
	tx push -s locales/_en.json

clean-locales:
	find locales/ -type f -exec bash -c 'cat {} | python -m json.tool > /tmp/lo.tmp && mv /tmp/lo.tmp {}' \;

push-en-locale:
	tx push -s
