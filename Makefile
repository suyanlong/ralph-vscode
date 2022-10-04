compile:
	yarn run compile

build: dep compile package

package: compile
	yarn vsce package

dep:
	yarn install

publish:
	./node_modules/vsce/vsce publish

clean:
	rm -rf ./ralph-vscode-*.vsix
	rm -rf ./dist
	rm -rf node_modules


fmt:
	yarn run fmt

lint:
	yarn run lint

antlr4ts:
	yarn run antlr4ts


test:
	yarn run test