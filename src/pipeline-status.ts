export interface PipeLineStatus {
  completed: 'completed';
  canceled: 'canceled';
  rejected: 'rejected';
  running: 'running';
}

export type PipeLineStatusType = PipeLineStatus[keyof PipeLineStatus];

/**
* The status of a Pipeline.
*/
export const pipelineStatus: PipeLineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};
