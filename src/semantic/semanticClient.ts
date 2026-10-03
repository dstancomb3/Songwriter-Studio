import type {
  Song,
} from "../types";

import type {
  SemanticConceptAnalysis,
} from "./localEmbeddings";

type PendingRequest = {
  resolve: (
    value:
      SemanticConceptAnalysis
  ) => void;
  reject: (
    reason?: unknown
  ) => void;
};

let worker:
  | Worker
  | null = null;

let nextId = 1;

const pending =
  new Map<
    number,
    PendingRequest
  >();

function getWorker() {
  if (worker) {
    return worker;
  }

  worker = new Worker(
    new URL(
      "./semantic.worker.ts",
      import.meta.url
    ),
    {
      type: "module",
    }
  );

  worker.onmessage = (
    event: MessageEvent<{
      id: number;
      ok: boolean;
      result?: SemanticConceptAnalysis;
      error?: string;
    }>
  ) => {
    const request =
      pending.get(
        event.data.id
      );

    if (!request) {
      return;
    }

    pending.delete(
      event.data.id
    );

    if (
      event.data.ok &&
      event.data.result
    ) {
      request.resolve(
        event.data.result
      );
      return;
    }

    request.reject(
      new Error(
        event.data.error ??
          "Local semantic analysis failed."
      )
    );
  };

  worker.onerror = (
    event
  ) => {
    const error =
      new Error(
        event.message ||
          "The local semantic worker crashed."
      );

    for (
      const request
      of pending.values()
    ) {
      request.reject(
        error
      );
    }

    pending.clear();
    worker?.terminate();
    worker = null;
  };

  return worker;
}

export function analyzeConceptLocally(
  song: Song
): Promise<SemanticConceptAnalysis> {
  const id =
    nextId++;

  return new Promise(
    (resolve, reject) => {
      pending.set(id, {
        resolve,
        reject,
      });

      getWorker().postMessage({
        id,
        operation:
          "analyze-concept",
        song,
      });
    }
  );
}
