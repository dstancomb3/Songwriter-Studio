import {
  analyzeSongConcept,
} from "./localEmbeddings";

import type {
  Song,
} from "../types";

type SemanticWorkerRequest = {
  id: number;
  operation: "analyze-concept";
  song: Song;
};

type WorkerScope = {
  onmessage:
    | ((
        event: MessageEvent<SemanticWorkerRequest>
      ) => void)
    | null;
  postMessage: (
    value: unknown
  ) => void;
};

const scope =
  globalThis as unknown as WorkerScope;

let queue =
  Promise.resolve();

async function handleRequest(
  request: SemanticWorkerRequest
) {
  try {
    const result =
      await analyzeSongConcept(
        request.song
      );

    scope.postMessage({
      id: request.id,
      ok: true,
      result,
    });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

scope.onmessage = (event) => {
  const request =
    event.data;

  queue = queue.then(
    () =>
      handleRequest(
        request
      ),
    () =>
      handleRequest(
        request
      )
  );
};
