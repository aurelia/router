export enum RouterEvent {
  processing = 'router:navigation:processing',
  error = 'router:navigation:error',
  canceled = 'router:navigation:canceled',
  complete = 'router:navigation:complete',
  success = 'router:navigation:success',
  childComplete = 'router:navigation:child:complete'
}
