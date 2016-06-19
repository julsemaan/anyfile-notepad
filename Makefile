client-dist:
	bash afn-app.sh
	mkdir client-dist
	cp -fr tmp/app-compiled/* client-dist/
	echo "Press any key to launch archive build." && read dummy
	tar cvfz client-dist.tgz client-dist/

clean-client-dist:
	rm -fr tmp/app-compiled/*
	rm -fr client-dist
	rm -f client-dist.tgz

.PHONY : extract-i18n-strings

extract-i18n-strings:
	grep -roP 'i18n.".*?"' app/ | grep -oP '".*"' | sort -h | uniq
	grep -r 'shared/modal' app/ | grep -oP ':title\s*=>\s*".*?"' | grep -oP '".*"'
	grep -r 'shared/modal' app/ | grep -oP ':message\s*=>\s*".*?"' | grep -oP '".*"'

.PHONY : deploy

deploy:
	make clean
	make build && \
		scp afn.tgz root@semaan.ca: && \
		ssh root@semaan.ca '/root/afn-utils/deploy_afn.sh production /root/afn.tgz'
