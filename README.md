# Chemscraper

## Backend repositories & related codebases

Chemscraper frontend leverages these backends to parse chemical symbols and render the results.

* [Chemscraper backend](https://gitlab.com/dprl/graphics-extraction/-/tree/prod), the primary entrypoint into backend code.
* [Symbolscraper container](https://gitlab.com/dprl/symbolscraper-server), chemical parsing of parsing *'born digital'* PDFs.
* [YOLO container](https://gitlab.com/dprl/yolov8sever) for localizing chemical symbols.
* [Line-of-sight with Graph Attention Parser (LGAP)](https://gitlab.com/dprl/lgap-parser), visual parser to recognize chemical symbols from images.

These 4 containers are built via [this Docker Compose](https://gitlab.com/dprl/dprl-alphasynthesis), and deployed via [this Helm chart](https://github.com/moleculemaker/chemscraper-helm-chart) in Kubernets.

## Development server

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.1.6.

For marvin.js license add the following lines to your `~/.npmrc`:
```
@chemaxon:registry=https://hub.chemaxon.com/artifactory/api/npm/npm/
hub.chemaxon.com/artifactory/api/npm/npm/:_auth="<auth>"
hub.chemaxon.com/artifactory/api/npm/npm/:_password="<password>"
hub.chemaxon.com/artifactory/api/npm/npm/:username=<user>
hub.chemaxon.com/artifactory/api/npm/npm/:email=<email>
hub.chemaxon.com/artifactory/api/npm/npm/:always-auth=true
```

MMLI members can reach out to developers for the secrets. Non-MMLI members will need to make arrangements for their own MarvinJS license.

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
