.PHONY: default dev test

default: test

dev:
	docker-compose --file ./docker-compose-dev.yml build
	docker-compose --file ./docker-compose-dev.yml up

.testenv: package.json
	docker build -t piksha_testenv -f Dockerfile.testenv .
	touch .testenv

test: .testenv
	docker run --rm -it -v `pwd`/app:/app/app -v `pwd`/spec:/app/spec -v `pwd`/stubs:/app/stubs -v `pwd`/.eslintrc:/app/.eslintrc piksha_testenv
