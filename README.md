# App4Sea

Web app for mobiles for oil spill response information

<img src="https://github.com/arnigeir/App4Sea/blob/master/App4Sea.png" align="center"
     title="App4Sea">

## Building

> Requires Node and NPM.

1. Enter `src/main`
2. npm ci
3. npm run build:prod

This builds the application to `dist/`. The development build can be built
using:

```sh
$ npm run build
```

and a WAR file can be built (to `dist/app4sea.war`) using:

```sh
$ npm run build:war
```

## Development server

Start a live-reloading development server using:

```sh
$ npm start -- --watch --open

It will open the page on localhost:9000
```

