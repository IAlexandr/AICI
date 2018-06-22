## SIMPLE DEPLOY

# TODO

- [x] pulling changes of git repo (api.github v4)
- [x] testing app
- [x] deploy app
- [ ] gql subscriptions of changed state
- [ ] manual start of testing/deploy
- [ ] send current status to slack (branch was updated, results of test, deploy)

## dependencies install

---

```
yarn debian/ubuntu:

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

sudo apt-get update && sudo apt-get install yarn

yarn --version

nodemon:
sudo npm install -g nodemon

sudo npm i -g babel-cli
```

# Install

## based on [deql-ms](https://github.com/IAlexandr/deql-ms)

### Initializing submodules:

- `git submodule init; git submodule update`

For one submodule (client/server):

- `git submodule init server/deql-ms-server`

- `git submodule update server/deql-ms-server`

# Example

## add personal access token to AICI

open https://github.com/settings/tokens

generate new token, then copy token to "githubApiToken" (AICI/server/config.js)

## repository clone and settings

generate ssh key

ssh-keygen -t rsa -b 4096 -C "aivanov@yandex.ru"

input file name ~/.ssh/id*rsa*< repository name >

open https://github.com/< username >/< repository name >/settings/keys

click on "Add deploy key" and paste result of "cat ~/.ssh/id*rsa*< repository name >.pub"

then go to the server console:

nano ~/.ssh/config

```
Host < repository name >
HostName github.com
User git
IdentityFile ~/.ssh/id_rsa_< repository name >
```

now you can clone repository:

`git clone < repository name >:< github owner name >/< repository name >`

for example: `git clone AICI:IAlexandr/AICI`

## repository with submodules

you need change url in .gitmodules

for example:

```
[submodule "server/deql-ms-server"]
	path = server/deql-ms-server
	#url = git@github.com:IAlexandr/deql-ms-server.git
	url = deql-ms-server:IAlexandr/deql-ms-server
```

init submodules

for example:

`git submodule init server/deql-ms-server`

use this if you already init with other url

`git submodule deinit server/deql-ms-server`
