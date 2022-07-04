# Summits 

## Tech overview
This project uses 
- Vite as bundler 
- Vue 3+ as frontend framwork
- Pinia as data stores 
- TypreScript

## Local dev setup
After cloning the repository, run `yarn` to install dependencies. 

Then copy `./src/config.ts.example` to `./src/config.ts` and adapt its contents. 
Also copy the `Summit.json` contract artifact to `./src/`. You might want to symlink in case you are working on the contracts as well. 

Run `yarn dev` to spin up a dev server. 

## Recommended IDE Setup

- LSP client (e.g.[VS Code](https://code.visualstudio.com/) or nvim) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
