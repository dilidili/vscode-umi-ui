import * as resolveFrom from 'resolve-from';
import { EventEmitter } from 'vscode';

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

    this.routes = this._service.getRoutes();
  }

  refreshRoutes() {
    this.routes = this._service.getRoutes();
    this.routeChangeEvent.fire();
  }

  getService = (cwd: string) => {
    const serviceModule = 'umi/_Service.js';
    const servicePath = resolveFrom.silent(cwd, serviceModule) || 'umi-build-dev/lib/Service';
    const Service = require(servicePath).default;

    return new Service({
      cwd,
    });
  };
}