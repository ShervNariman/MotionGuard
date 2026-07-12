import type {
  MotionGuardFrame,
  MotionGuardInteractionEvent,
  MotionGuardTargetSnapshot,
} from "@motionguard/core";
import type { Page } from "playwright-core";
import type { NormalizedPlaywrightScenario } from "./config.js";
import { MotionGuardPlaywrightError } from "./errors.js";

export type RawPageSample = Readonly<{
  atMs: number;
  targets: readonly MotionGuardTargetSnapshot[];
  interactions: readonly MotionGuardInteractionEvent[];
}>;

type RecorderTarget = Readonly<{
  id: string;
  selector: string;
  motionIntent: "essential" | "non-essential" | "unknown";
  state?: Readonly<{
    attribute: string;
    openValues?: readonly string[];
    closedValues?: readonly string[];
    enteringValues?: readonly string[];
    exitingValues?: readonly string[];
  }>;
}>;

function recorderKey(): string {
  return `__motionguard_${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function validateTargets(
  page: Page,
  scenario: NormalizedPlaywrightScenario,
): Promise<void> {
  for (const target of scenario.targets) {
    let count: number;
    try {
      count = await page.locator(target.selector).count();
    } catch (error) {
      throw new MotionGuardPlaywrightError(
        "INVALID_CONFIGURATION",
        `Invalid selector for target ${target.id}: ${target.selector}`,
        error,
      );
    }
    if (count === 0) {
      throw new MotionGuardPlaywrightError(
        "TARGET_NOT_FOUND",
        `Target ${target.id} did not match any element: ${target.selector}`,
      );
    }
    if (count > 1) {
      throw new MotionGuardPlaywrightError(
        "DUPLICATE_TARGET",
        `Target ${target.id} matched ${String(count)} elements: ${target.selector}`,
      );
    }
  }
}

export async function installPageRecorder(
  page: Page,
  scenario: NormalizedPlaywrightScenario,
): Promise<Readonly<{ key: string; startedAt: number }>> {
  const key = recorderKey();
  const targets: readonly RecorderTarget[] = scenario.targets;
  const startedAt = await page.evaluate(
    ({
      propertyKey,
      definitions,
    }: {
      propertyKey: string;
      definitions: readonly RecorderTarget[];
    }) => {
      type StoredInteraction = {
        id: string;
        atMs: number;
        type: "pointer-down" | "pointer-up" | "click" | "key-down";
        targetId: string;
        point: { x: number; y: number } | null;
        key: string | null;
        stateValue: null;
      };
      type RecorderState = {
        startedAt: number;
        sequence: number;
        interactions: StoredInteraction[];
        definitions: readonly RecorderTarget[];
      };
      const globalObject = window as unknown as Record<string, RecorderState>;
      const state: RecorderState = {
        startedAt: performance.now(),
        sequence: 0,
        interactions: [],
        definitions,
      };
      const activePointers = new Map<number, string>();
      Object.defineProperty(globalObject, propertyKey, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: state,
      });

      const targetIdFor = (eventTarget: EventTarget | null): string | null => {
        if (!(eventTarget instanceof Element)) return null;
        for (const definition of state.definitions) {
          try {
            if (eventTarget.closest(definition.selector) !== null) return definition.id;
          } catch {
            return null;
          }
        }
        return null;
      };
      const record = (
        event: Event,
        type: StoredInteraction["type"],
        point: StoredInteraction["point"],
        keyValue: string | null,
        forcedTargetId?: string | null,
      ): void => {
        const targetId = forcedTargetId ?? targetIdFor(event.target);
        if (targetId === null) return;
        state.sequence += 1;
        state.interactions.push({
          id: `${type}-${String(state.sequence)}`,
          atMs: Math.max(0, performance.now() - state.startedAt),
          type,
          targetId,
          point,
          key: keyValue,
          stateValue: null,
        });
      };
      document.addEventListener(
        "pointerdown",
        (event) => {
          const targetId = targetIdFor(event.target);
          if (targetId !== null) activePointers.set(event.pointerId, targetId);
          record(event, "pointer-down", { x: event.clientX, y: event.clientY }, null, targetId);
        },
        true,
      );
      document.addEventListener(
        "pointerup",
        (event) => {
          const targetId = activePointers.get(event.pointerId) ?? targetIdFor(event.target);
          activePointers.delete(event.pointerId);
          record(event, "pointer-up", { x: event.clientX, y: event.clientY }, null, targetId);
        },
        true,
      );
      document.addEventListener(
        "click",
        (event) => record(event, "click", { x: event.clientX, y: event.clientY }, null),
        true,
      );
      document.addEventListener(
        "keydown",
        (event) => record(event, "key-down", null, event.key.slice(0, 128)),
        true,
      );
      return state.startedAt;
    },
    { propertyKey: key, definitions: targets },
  );
  return Object.freeze({ key, startedAt });
}

export async function samplePage(
  page: Page,
  key: string,
  scenario: NormalizedPlaywrightScenario,
): Promise<RawPageSample> {
  const raw = await page.evaluate(
    ({
      propertyKey,
      definitions,
    }: {
      propertyKey: string;
      definitions: readonly RecorderTarget[];
    }) => {
      type RecorderState = {
        startedAt: number;
        sequence: number;
        interactions: MotionGuardInteractionEvent[];
      };
      const globalObject = window as unknown as Record<string, RecorderState | undefined>;
      const state = globalObject[propertyKey];
      if (state === undefined) throw new Error("MotionGuard page recorder is unavailable.");

      const values = (items: readonly string[] | undefined): readonly string[] => items ?? [];
      const declaredState = (
        element: Element,
        definition: RecorderTarget,
      ): Readonly<{
        declared: "open" | "closed" | null;
        phase: "idle" | "entering" | "exiting";
      }> => {
        const mapping = definition.state;
        let attribute: string | null = null;
        let openValues: readonly string[] = [];
        let closedValues: readonly string[] = [];
        let enteringValues: readonly string[] = [];
        let exitingValues: readonly string[] = [];
        if (mapping !== undefined) {
          attribute = element.getAttribute(mapping.attribute);
          openValues = values(mapping.openValues);
          closedValues = values(mapping.closedValues);
          enteringValues = values(mapping.enteringValues);
          exitingValues = values(mapping.exitingValues);
        } else if (element.hasAttribute("aria-expanded")) {
          attribute = element.getAttribute("aria-expanded");
          openValues = ["true"];
          closedValues = ["false"];
        } else if (element.hasAttribute("data-state")) {
          attribute = element.getAttribute("data-state");
          openValues = ["open"];
          closedValues = ["closed"];
          enteringValues = ["entering", "opening"];
          exitingValues = ["exiting", "closing"];
        }
        const normalized = attribute?.toLowerCase() ?? null;
        const phase =
          normalized !== null && enteringValues.includes(normalized)
            ? "entering"
            : normalized !== null && exitingValues.includes(normalized)
              ? "exiting"
              : "idle";
        const declared =
          normalized !== null && openValues.includes(normalized)
            ? "open"
            : normalized !== null && closedValues.includes(normalized)
              ? "closed"
              : null;
        return { declared, phase };
      };
      const focusable = (element: Element, style: CSSStyleDeclaration): boolean => {
        if (!(element instanceof HTMLElement || element instanceof SVGElement)) return false;
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.visibility === "collapse"
        ) {
          return false;
        }
        if (element.closest("[inert]") !== null) return false;
        if (
          element instanceof HTMLButtonElement ||
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
        ) {
          if (element.disabled) return false;
        }
        if (element instanceof HTMLAnchorElement && element.hasAttribute("href")) return true;
        if (element instanceof HTMLElement && element.isContentEditable) return true;
        return element.matches(
          "button,input,select,textarea,iframe,object,embed,summary,audio[controls],video[controls],[tabindex]",
        );
      };

      const targets: MotionGuardTargetSnapshot[] = [];
      for (const definition of definitions) {
        let matches: NodeListOf<Element>;
        try {
          matches = document.querySelectorAll(definition.selector);
        } catch {
          throw new Error(`Invalid selector during sampling: ${definition.selector}`);
        }
        if (matches.length > 1) {
          throw new Error(`Target became ambiguous during sampling: ${definition.id}`);
        }
        const element = matches.item(0);
        if (element === null) continue;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const opacity = Number.parseFloat(style.opacity);
        targets.push({
          id: definition.id,
          selector: definition.selector,
          connected: element.isConnected,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          visual: {
            display: style.display.slice(0, 128),
            visibility: style.visibility.slice(0, 128),
            opacity: Number.isFinite(opacity) ? opacity : 1,
            pointerEvents: style.pointerEvents.slice(0, 128),
            transform: style.transform.slice(0, 512),
          },
          accessibility: {
            focusable: focusable(element, style),
            focused: document.activeElement === element,
            ariaHidden: element.getAttribute("aria-hidden") === "true",
            ariaExpanded:
              element.getAttribute("aria-expanded") === "true"
                ? true
                : element.getAttribute("aria-expanded") === "false"
                  ? false
                  : null,
          },
          state: declaredState(element, definition),
          motionIntent: definition.motionIntent,
        });
      }
      const interactions = state.interactions.splice(0, state.interactions.length);
      return {
        atMs: Math.max(0, performance.now() - state.startedAt),
        targets,
        interactions,
      };
    },
    { propertyKey: key, definitions: scenario.targets },
  );

  return Object.freeze({
    atMs: raw.atMs,
    targets: Object.freeze(raw.targets),
    interactions: Object.freeze(raw.interactions),
  });
}

export function asFrame(sample: RawPageSample): MotionGuardFrame {
  return Object.freeze({ atMs: sample.atMs, targets: sample.targets });
}
