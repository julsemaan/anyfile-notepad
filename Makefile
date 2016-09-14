client-dist.tgz:
	make client/dist
	echo "Press any key to launch archive build." && read dummy
	tar -C client/ -cvzf client-dist.tgz dist/

client/dist:
	mkdir client/dist
	AFN_BUILD_DIR=client/dist/ bash afn-app.sh

clean:
	rm -fr client/dist
	rm -f client-dist.tgz

.PHONY : deploy

deploy:
	make clean
	make build && \
		scp afn.tgz root@semaan.ca: && \
		ssh root@semaan.ca '/root/afn-utils/deploy_afn.sh production /root/afn.tgz'
