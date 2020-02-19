export default `import { AnyAction, Dispatch } from 'redux';
{{#models}}
import { {{name}}ModelState } from '{{{relativePath}}}';
{{/models}}

export { {{exportStates}} };

export interface ConnectState {
{{#models}}
  {{nameLowerCase}}: {{name}}ModelState;
{{/models}}	
};

export interface ConnectProps {
  dispatch?: Dispatch<AnyAction>;
};`;
