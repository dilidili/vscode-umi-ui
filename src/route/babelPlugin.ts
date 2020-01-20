// @ts-nocheck
import { SourceLocation } from './RouteProvider';

export const removeRoutePlugin = (item, setRemoveSourceLocation: (SourceLocation) => void) => {
  return ({ types }) => {
    return {
      visitor: {
        ExportDefaultDeclaration(path, state) {
          try {
            const routesProperty = path.get('declaration.expression');
            const keyPath = item.keyPath.split('.');

            const targetRoute = keyPath.reduce((r, v) => {
              r = r.get('properties').find(v => v.node.key.name === 'routes');

              return r.get(`value.elements.${v}`);
            }, routesProperty);

            if (targetRoute) {
              setRemoveSourceLocation(targetRoute.node.loc);
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    };
  }
}