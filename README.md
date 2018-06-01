## SIMPLE DEPLOY

### TODO

* [ ] pulling changes of git repo (api.github v4)
* [ ] send current status to slack (branch was updated, results of test, deploy)
* [ ] testing app
* [ ] deploy app
* [ ] manual start of testing/deploy

## based on [deql-ms](https://github.com/IAlexandr/deql-ms)

### Initializing submodules:

* `git submodule init; git submodule update`

For one submodule (client/server):

* `git submodule init server/deql-ms-server`

* `git submodule update server/deql-ms-server`

### NPM commands:

`npm run <operation>`

* "init" - install dependencies: client and server,
* "init_client",
* "init_server",
* "client",
* "server",
* "start" - run: client and server
* "ms_deps_install" - run docker-compose-deps (prisma, postgres, pgadmin, redis, redis-commander)
* "redis_commander" start redis-commander on port :8099

### INSTALL DEPENDENCIES

npm run ms_deps_install
