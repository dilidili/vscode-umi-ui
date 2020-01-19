// @ts-nocheck

export const removeRoutePlugin = (item) => {
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

            targetRoute.remove()
          } catch (err) {
            console.log(err);
          }
        }
      }
    };
  }
}