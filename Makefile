build:
	bash build.sh

clean:
	rm -fr build
	rm -fr dist

.PHONY : extract-i18n-strings

extract-i18n-strings:
	grep -roP 'i18n.".*?"' app/ | grep -oP '".*"' | sort -h | uniq
