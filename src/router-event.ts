/**
 * A list of known router events used by the Aurelia router
 * to signal the pipeline has come to a certain state
 */
// const enum is preserved in tsconfig
export const enum RouterEvent {
  Processing = 'router:navigation:processing',
  Error = 'router:navigation:error',
  Canceled = 'router:navigation:canceled',
  Complete = 'router:navigation:complete',
  Success = 'router:navigation:success',
  ChildComplete = 'router:navigation:child:complete'
}
