import type { Page } from "@playwright/test";

// names do not survive the production bundle: renders are attributed to page regions
type Fiber = {
  tag: number;
  flags: number;
  child: Fiber | null;
  sibling: Fiber | null;
  alternate: Fiber | null;
  stateNode: unknown;
  memoizedState: unknown;
};
type FiberRoot = { current: Fiber };
type HookCell = { memoizedState: unknown; next: HookCell | null };
type SocketLike = { listeners: (event: string) => Array<(p: unknown) => void> };

export type Probe = {
  commits: number;
  renders: Record<string, number>;
  // render counting walks the tree on every commit; timing runs switch it off
  counting: boolean;
  reset: () => void;
  findSocket: () => SocketLike | undefined;
  emit: (event: string, payload: unknown) => void;
};
type ProbeWindow = Window & {
  __probe: Probe;
  __REACT_DEVTOOLS_GLOBAL_HOOK__: unknown;
};

// a component renders "in" a region when the first DOM element it draws matches
export const REGIONS = {
  testRunList: "#test-run-list *",
  dataGrid: ".MuiDataGrid-root, .MuiDataGrid-root *",
} as const;
export type Region = keyof typeof REGIONS;

// serialized into the page: must not use anything from this module
function installProbe(regions: Record<string, string>) {
  const w = window as unknown as ProbeWindow;
  const HOST_COMPONENT = 5;
  const PERFORMED_WORK = 1;
  // function component, forwardRef, simple memo
  const COMPONENT_TAGS = [0, 11, 15];
  const roots: FiberRoot[] = [];
  let socket: SocketLike | undefined;

  // the app's socket sits in the state of SocketProvider's reducer
  const socketInHooks = (fiber: Fiber): SocketLike | undefined => {
    let hook = fiber.memoizedState as HookCell | null;
    while (hook && typeof hook === "object" && "next" in hook) {
      const state = hook.memoizedState as { socket?: SocketLike } | null;
      if (typeof state?.socket?.listeners === "function") return state.socket;
      hook = hook.next;
    }
    return undefined;
  };

  const findSocketIn = (root: FiberRoot): SocketLike | undefined => {
    const stack: Fiber[] = [root.current];
    while (stack.length) {
      const fiber = stack.pop();
      const found = fiber.tag === 0 ? socketInHooks(fiber) : undefined;
      if (found) return found;
      if (fiber.child) stack.push(fiber.child);
      if (fiber.sibling) stack.push(fiber.sibling);
    }
    return undefined;
  };

  const probe: Probe = {
    commits: 0,
    renders: {},
    counting: true,
    reset() {
      probe.commits = 0;
      probe.renders = {};
    },
    findSocket() {
      for (const root of roots) {
        if (socket) break;
        socket = findSocketIn(root);
      }
      return socket;
    },
    emit(event, payload) {
      probe
        .findSocket()
        ?.listeners(event)
        .forEach((listener) => listener(payload));
    },
  };

  const firstElement = (fiber: Fiber): Element | undefined => {
    let f: Fiber | null = fiber;
    while (f && f.tag !== HOST_COMPONENT) f = f.child;
    return f?.stateNode instanceof Element ? f.stateNode : undefined;
  };

  const didRender = (next: Fiber, prev: Fiber | null) =>
    COMPONENT_TAGS.includes(next.tag) &&
    (!prev || (next.flags & PERFORMED_WORK) === PERFORMED_WORK);

  const attribute = (fiber: Fiber) => {
    const el = firstElement(fiber);
    if (!el) return;
    for (const [name, selector] of Object.entries(regions)) {
      if (el.matches(selector)) {
        probe.renders[name] = (probe.renders[name] ?? 0) + 1;
      }
    }
  };

  const countRenders = (next: Fiber, prev: Fiber | null) => {
    const stack: Array<[Fiber, Fiber | null]> = [[next, prev]];
    while (stack.length) {
      const [n, p] = stack.pop();
      if (didRender(n, p)) attribute(n);
      // a bailed-out subtree is the same objects as before
      if (p && n.child === p.child) continue;
      let child = n.child;
      while (child) {
        stack.push([child, child.alternate]);
        child = child.sibling;
      }
    }
  };

  // React reports its commits to this hook when one is on the page
  w.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    isDisabled: false,
    renderers: new Map(),
    inject() {
      return 1;
    },
    onCommitFiberRoot(_id: number, root: FiberRoot) {
      probe.commits++;
      if (!roots.includes(root)) roots.push(root);
      if (probe.counting) {
        countRenders(root.current, root.current.alternate);
      }
    },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onScheduleFiberRoot() {},
    checkDCE() {},
  };
  w.__probe = probe;
}

export async function installReactProbe(page: Page) {
  await page.addInitScript(installProbe, { ...REGIONS });
}

export const resetProbe = (page: Page) =>
  page.evaluate(() => (window as unknown as ProbeWindow).__probe.reset());

export const setCounting = (page: Page, counting: boolean) =>
  page.evaluate((on) => {
    (window as unknown as ProbeWindow).__probe.counting = on;
  }, counting);

// finds the socket now, so that the walk is not part of a measured step
export const hasSocket = (page: Page) =>
  page.evaluate(
    () => !!(window as unknown as ProbeWindow).__probe.findSocket(),
  );

export const emitSocketEvent = (page: Page, event: string, payload: unknown) =>
  page.evaluate(
    ([name, data]) =>
      (window as unknown as ProbeWindow).__probe.emit(name, data),
    [event, payload] as const,
  );

export const waitForQuietCommits = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const probe = (window as unknown as ProbeWindow).__probe;
        let last = -1;
        const check = () => {
          if (probe.commits === last) return resolve();
          last = probe.commits;
          setTimeout(check, 400);
        };
        setTimeout(check, 400);
      }),
  );

export const readRenders = (page: Page) =>
  page.evaluate(() => {
    const { renders, commits } = (window as unknown as ProbeWindow).__probe;
    return { commits, renders: { ...renders } };
  });
