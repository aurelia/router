import * as rollup from 'rollup';

export interface IRollupWatchOptions extends rollup.RollupWatchOptions {
  tsConfig?: { target: string };
}
