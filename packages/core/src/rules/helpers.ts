import type { MotionGuardFrame, MotionGuardTargetSnapshot, MotionGuardTrace } from "../trace.js";

export type TargetFrame = Readonly<{
  frameIndex: number;
  frame: MotionGuardFrame;
  target: MotionGuardTargetSnapshot;
}>;

export type MotionGuardTraceIndex = Readonly<{
  targetIds: readonly string[];
  framesByTarget: ReadonlyMap<string, readonly TargetFrame[]>;
}>;

export function createTraceIndex(trace: MotionGuardTrace): MotionGuardTraceIndex {
  const mutable = new Map<string, TargetFrame[]>();
  trace.frames.forEach((frame, frameIndex) => {
    for (const target of frame.targets) {
      const entries = mutable.get(target.id) ?? [];
      entries.push(Object.freeze({ frameIndex, frame, target }));
      mutable.set(target.id, entries);
    }
  });

  const framesByTarget = new Map<string, readonly TargetFrame[]>();
  for (const [targetId, entries] of mutable) {
    framesByTarget.set(targetId, Object.freeze(entries));
  }

  return Object.freeze({
    targetIds: Object.freeze([...framesByTarget.keys()].sort()),
    framesByTarget,
  });
}

export function framesForTarget(
  index: MotionGuardTraceIndex,
  targetId: string,
): readonly TargetFrame[] {
  return index.framesByTarget.get(targetId) ?? Object.freeze([]);
}
