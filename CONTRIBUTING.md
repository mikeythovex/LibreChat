
`npm ci`



`npm run build:data-provider`


### Linux command to Remove all existing images
docker images -a | grep "librechat" | awk '{print $3}' | xargs docker rmi

then https://www.librechat.ai/docs/local/docker#update-librechat


run backend in dev container and for frontend, run npm i then npm run dev outside of dev container

