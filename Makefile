build:
	rails s -e build -p 3001 -P tmp/pids/build-server.pid &
	sleep 15
	bash build.sh
	bash -c 'kill `cat tmp/pids/build-server.pid`'

clean:
	rm -fr build
	rm -fr dist

.PHONY : extract-i18n-strings

extract-i18n-strings:
	grep -roP 'i18n.".*?"' app/ | grep -oP '".*"' | sort -h | uniq
	grep -r 'shared/modal' app/ | grep -oP ':title\s*=>\s*".*?"' | grep -oP '".*"'
	grep -r 'shared/modal' app/ | grep -oP ':message\s*=>\s*".*?"' | grep -oP '".*"'
