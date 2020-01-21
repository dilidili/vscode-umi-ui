import * as resolveFrom from 'resolve-from';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { EventEmitter } from 'vscode';
import { getConfigFile } from './config';

export type Route = {
  component: string;
  path: string;
  redirect?: string;
  exact?: boolean;
  routes?: [Route];
};

export class Service {
  private _service: any;

  public routeChangeEvent: EventEmitter<void>;
  public routes: Route[] = [];

  constructor(
    public cwd: string,
  ) {
    this._service = this.getService(cwd);
    this._service.init();

    this.routeChangeEvent = new EventEmitter<void>();
    this.initRouteChangeEvent();

    this.routes = this._service.getRoutes();
  }

  initRouteChangeEvent() {
    const configFilePath = getConfigFile(this.cwd);
    fs.watchFile(configFilePath, { interval: 1000 }, () => {
      this.refreshRoutes();
    });
  }

  refreshRoutes() {
    this.routes = this._service.getRoutes();
    this.routeChangeEvent.fire();
  }

  private getService = (cwd: string) => {
    const serviceModule = 'umi/_Service.js';
    const servicePath = resolveFrom.silent(cwd, serviceModule) || 'umi-build-dev/lib/Service';
    const Service = require(servicePath).default;

    return new Service({
      cwd,
    });
  };
}