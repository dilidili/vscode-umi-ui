// @ts-nocheck
import * as recast from 'recast';
import * as babel from '@babel/core';

function setAst(babel, { ast }) {
  return {
    visitor: {
      Program(path) {
        path.replaceWith(ast.program);
      }
    }
  };
}

export async function babelRecast(code: string, parserOpts, transformerOpts) {
  const ast = recast.parse(code, {
    parser: {
      parse: source => babel.parse(source, { ...parserOpts }),
    },
    reuseWhitespace: false,
  });

  const opts = Object.assign(
    {
      ast: true,
      code: false,
    },
    transformerOpts,
    {
      plugins: [
        // For some reason, recast doesn't work with transformFromAst.
        // Use this hack instead.
        [setAst, { ast }]
      ].concat(transformerOpts.plugins || [])
    }
  );

  const output = babel.transformSync("", opts);

  return recast.print(output.ast).code;
}

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

            if (targetRoute) {
              targetRoute.remove()
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    };
  }
}

export const addRoutePlugin = (item) => {
  return ({ types: t }) => {
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
              const routeNode = t.ObjectExpression([
                t.ObjectProperty(t.Identifier('path'), t.stringLiteral('newPath')),
                t.ObjectProperty(t.Identifier('component'), t.stringLiteral('newComponent')),
              ]);

              const targetRoutesProperty = targetRoute.node.properties.find(v => v.key.name === 'routes');
              if (targetRoutesProperty) {
                targetRoutesProperty.value.elements.push(routeNode);
              } else {
                targetRoute.node.properties.push(t.ObjectProperty(
                  t.Identifier('routes'), 
                  t.ArrayExpression([routeNode]),
                ));
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    };
  }
}