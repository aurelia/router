/**
 * An optional interface describing the available activation strategies.
 * @internal Used internally.
 */
export const enum InternalActivationStrategy {
  /**
   * Reuse the existing view model, without invoking Router lifecycle hooks.
   */
  NoChange = 'no-change',
  /**
   * Reuse the existing view model, invoking Router lifecycle hooks.
   */
  InvokeLifecycle = 'invoke-lifecycle',
  /**
   * Replace the existing view model, invoking Router lifecycle hooks.
   */
  Replace = 'replace'
}

/**
 * The strategy to use when activating modules during navigation.
 */
// kept for compat reason
export const activationStrategy: ActivationStrategy = {
  noChange: InternalActivationStrategy.NoChange,
  invokeLifecycle: InternalActivationStrategy.InvokeLifecycle,
  replace: InternalActivationStrategy.Replace
};

/**
 * An optional interface describing the available activation strategies.
 */
export interface ActivationStrategy {
  /**
  * Reuse the existing view model, without invoking Router lifecycle hooks.
  */
  noChange: 'no-change';
  /**
  * Reuse the existing view model, invoking Router lifecycle hooks.
  */
  invokeLifecycle: 'invoke-lifecycle';
  /**
  * Replace the existing view model, invoking Router lifecycle hooks.
  */
  replace: 'replace';
}

/**
 * Enum like type for activation strategy built-in values
 */
export type ActivationStrategyType = ActivationStrategy[keyof ActivationStrategy];
