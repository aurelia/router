/**
 * Available pipeline slot names to insert interceptor into router pipeline
 */
// const enum is preserved in tsconfig
export const enum PipelineSlotName {
  /**
   * Authorization slot. Invoked early in the pipeline,
   * before `canActivate` hook of incoming route
   */
  Authorize = 'authorize',
  /**
   * Pre-activation slot. Invoked early in the pipeline,
   * Invoked timing:
   *   - after Authorization slot
   *   - after canActivate hook on new view model
   *   - before deactivate hook on old view model
   *   - before activate hook on new view model
   */
  PreActivate = 'preActivate',
  /**
   * Pre-render slot. Invoked later in the pipeline
   * Invokcation timing:
   *   - after activate hook on new view model
   *   - before commit step on new navigation instruction
   */
  PreRender = 'preRender',
  /**
   * Post-render slot. Invoked last in the pipeline
   */
  PostRender = 'postRender'
}
