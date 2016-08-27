client-dist.tgz:
	mkdir client/dist
	AFN_BUILD_DIR=client/dist/ bash afn-app.sh
	echo "Press any key to launch archive build." && read dummy
	tar -C client/ -cvzf client-dist.tgz dist/

clean:
	rm -fr client/dist
	rm -f client-dist.tgz

.PHONY : extract-i18n-strings

extract-i18n-strings:
	grep -roP 'i18n.".*?"' client/ | grep -oP '".*"' | sort -h | uniq
	grep -r 'modal' client/ | grep -oP 'title\s*=\s*".*?"' | grep -oP '".*"'
	grep -r 'modal' client/ | grep -oP 'message\s*=\s*".*?"' | grep -oP '".*"'

.PHONY : deploy

deploy:
	make clean
	make build && \
		scp afn.tgz root@semaan.ca: && \
		ssh root@semaan.ca '/root/afn-utils/deploy_afn.sh production /root/afn.tgz'
