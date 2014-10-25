APP_NAME=queequeg
HOST=localhost
PORT=3000
SINGULARITY_HOST=localhost
SINGULARITY_PORT=7099

usage :
	@echo ''
	@echo '$(APP_NAME)'
	@echo '----------------------------------'
	@echo ''
	@echo 'Core tasks           : Description'
	@echo '-------------------- : -----------'
	@echo 'make setup           : Install dependencies'
	@echo 'make server          : Start listener on port $(PORT)'
	@echo ''

setup:
	npm install

server:
	HOST=$(HOST) PORT=$(PORT) SINGULARITY_HOST=$(SINGULARITY_HOST) SINGULARITY_PORT=$(SINGULARITY_PORT) node queequeg.js
