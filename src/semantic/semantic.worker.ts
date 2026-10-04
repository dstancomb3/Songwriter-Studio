import {
  analyzeSongConcept,
  findRelatedIdeas,
} from "./localEmbeddings";

import type {
  Song,
} from "../types";

import type {
  SemanticIdeaCandidate,
} from "./localEmbeddings";

type SemanticWorkerRequest =
  | {
      id: number;
      operation:
        "analyze-concept";
      song: Song;
    }
  | {
      id: number;
      operation:
        "related-ideas";
      queryText: string;
      candidates:
        SemanticIdeaCandidate[];
      limit: number;
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
      request.operation ===
      "analyze-concept"
        ? await analyzeSongConcept(
            request.song
          )
        : await findRelatedIdeas(
            request.queryText,
            request.candidates,
            request.limit
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
