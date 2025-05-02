

### Development setup

#### Initial setup

`npm ci`

`npm run frontend`

`num run backend`

#### Run backend in vscode dev container
`npm run backend:dev`

#### Run frontend
`cd client/`

`npm i && npm run build` if needed

`npm run dev` to run

http://localhost:3090 to run


### Rebase with upstream
if needed: `git remote add upstream https://github.com/danny-avila/LibreChat.git` (`git remote -v` to view upstream)

`git fetch upstream` 

`git rebase upstream/main`

`git add ... && git commit ...`

`git rebase --continue`

`git push -f`

`npm ci`

`npm run frontend`


## Install

`npm ci`

`npm run frontend`


### Update on server
```
sudo docker compose up -d --build api
```
<!-- ``` old command
sudo docker compose down --remove-orphans && \
sudo docker images -a | grep "librechat" | awk '{print $3}' | sudo xargs docker rmi -f && \
sudo docker compose up -d --build --force-recreate
``` -->

also see https://www.librechat.ai/docs/local/docker#update-librechat



## Misc
* Filter out models from model select in `useEndpoints.ts`
* Provider order in `client/src/components/Chat/Menus/Endpoints/components/EndpointModelItem.tsx`
