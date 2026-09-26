export const LIFECYCLE_STAGES = ['concept', 'planning', 'ready', 'in_progress', 'completed', 'archived'];
export function isValidStageAdvance(current, target) {
  const i1 = LIFECYCLE_STAGES.indexOf(current);
  const i2 = LIFECYCLE_STAGES.indexOf(target);
  return i1 !== -1 && i2 === i1 + 1;
}