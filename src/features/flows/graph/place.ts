import type { DraftNode } from '@/services/api/types';

/** Horizontal step between steps added at the same spot (a card is ~240 px wide). */
export const PLACE_STEP_X = 280;
const NEAR = 40;

/** The first spot at or right of `at` that no step occupies (so new steps never stack). */
export const freeSpot = (
  nodes: Pick<DraftNode, 'position'>[],
  at: { x: number; y: number },
): { x: number; y: number } => {
  const spot = { x: Math.round(at.x), y: Math.round(at.y) };
  const taken = (x: number) =>
    nodes.some((n) => Math.abs(n.position.x - x) < NEAR && Math.abs(n.position.y - spot.y) < NEAR);
  while (taken(spot.x)) spot.x += PLACE_STEP_X;
  return spot;
};
