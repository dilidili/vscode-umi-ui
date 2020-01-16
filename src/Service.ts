import * as resolveFrom from 'resolve-from';

export type Route = {
  component: string;
  path: string;
  exact?: boolean;
  routes?: [Route];
};

export class Service {
  private _service: any;
  public routes: Route[] = [];

  constructor(
    public cwd: string,
  ) {
    this._service = this.getService(cwd);
    this._service.init();
    this.routes = this._service.getRoutes();
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