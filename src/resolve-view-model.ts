import { PropName } from './constants';
import { RouteConfig, ViewPortInstruction } from './interfaces';

/**@internal exported for unit testing */
export async function resolveViewModel(viewPortInstruction: ViewPortInstruction | RouteConfig): Promise<string | Function | null> {
  if (PropName.moduleId in viewPortInstruction) {
    return viewPortInstruction.moduleId;
  }
  if (PropName.viewModel in viewPortInstruction) {
    let $viewModel = await viewPortInstruction.viewModel();
    if ($viewModel && typeof $viewModel === 'object') {
      $viewModel = $viewModel.default as Function;
    }
    if (typeof $viewModel !== 'function' && $viewModel !== null) {
      throw new Error(`Invalid viewModel specification in ${viewPortInstruction.name || ''} viewport/route config`);
    }
    return $viewModel as Function | null;
  }
  throw new Error(`moduleId/viewModel not found in ${viewPortInstruction.name || ''} viewport/route config`);
}
