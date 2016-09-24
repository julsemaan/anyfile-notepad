client-dist.tgz:
	make client/dist
	echo "Press any key to launch archive build." && read dummy
	tar -C client/ -cvzf client-dist.tgz dist/

client/dist:
	mkdir client/dist
	AFN_BUILD_DIR=client/dist/ bash afn-app.sh

client/fully-static:
	make client/dist
	mkdir -p client/fully-static/
	cp -rp client/dist/* client/fully-static/
	# news
	mkdir -p client/fully-static/news
	cp client/fully-static/site/news.html client/fully-static/news/index.html
	cp client/fully-static/site/news.html client/fully-static/news.html
	# faq
	mkdir -p client/fully-static/faq
	cp client/fully-static/site/faq.html client/fully-static/faq/index.html
	cp client/fully-static/site/faq.html client/fully-static/faq.html
	# help-translate
	mkdir -p client/fully-static/help-translate
	cp client/fully-static/site/help_translate.html client/fully-static/help-translate/index.html
	cp client/fully-static/site/help_translate.html client/fully-static/help-translate.html
	# app
	mkdir -p client/fully-static/app
	cp client/fully-static/app.html client/fully-static/app/index.html

clean:
	rm -fr client/dist
	rm -fr client/fully-static/
	rm -f client-dist.tgz

.PHONY : deploy

deploy:
	make clean
	make build && \
		scp afn.tgz root@semaan.ca: && \
		ssh root@semaan.ca '/root/afn-utils/deploy_afn.sh production /root/afn.tgz'
