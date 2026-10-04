import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ModalTone =
  | "default"
  | "danger";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ModalTone;
};

type PromptOptions = {
  title: string;
  message?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type NotifyOptions = {
  title: string;
  message?: string;
  tone?: "default" | "success" | "danger";
  durationMs?: number;
};

type ModalState =
  | {
      kind: "confirm";
      options: ConfirmOptions;
      resolve: (
        value: boolean
      ) => void;
    }
  | {
      kind: "prompt";
      options: PromptOptions;
      resolve: (
        value:
          | string
          | null
      ) => void;
    }
  | null;

type Toast = {
  id: string;
  title: string;
  message?: string;
  tone:
    | "default"
    | "success"
    | "danger";
};

type StudioModalContextValue = {
  confirm: (
    options: ConfirmOptions
  ) => Promise<boolean>;
  prompt: (
    options: PromptOptions
  ) => Promise<string | null>;
  notify: (
    options: NotifyOptions
  ) => void;
};

const StudioModalContext =
  createContext<
    StudioModalContextValue | null
  >(null);

export function StudioModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    modal,
    setModal,
  ] = useState<
    ModalState
  >(null);

  const [
    promptValue,
    setPromptValue,
  ] = useState("");

  const [
    toasts,
    setToasts,
  ] = useState<
    Toast[]
  >([]);

  const inputRef =
    useRef<
      HTMLInputElement | null
    >(null);

  const confirm =
    useCallback(
      (
        options:
          ConfirmOptions
      ) =>
        new Promise<boolean>(
          (resolve) => {
            setModal({
              kind:
                "confirm",
              options,
              resolve,
            });
          }
        ),
      []
    );

  const prompt =
    useCallback(
      (
        options:
          PromptOptions
      ) =>
        new Promise<
          string | null
        >((resolve) => {
          setPromptValue(
            options.initialValue ??
              ""
          );

          setModal({
            kind:
              "prompt",
            options,
            resolve,
          });
        }),
      []
    );

  const notify =
    useCallback(
      (
        options:
          NotifyOptions
      ) => {
        const id =
          crypto.randomUUID();

        const toast:
          Toast = {
          id,
          title:
            options.title,
          message:
            options.message,
          tone:
            options.tone ??
            "default",
        };

        setToasts(
          (current) => [
            ...current,
            toast,
          ].slice(-4)
        );

        window.setTimeout(
          () => {
            setToasts(
              (current) =>
                current.filter(
                  (item) =>
                    item.id !==
                    id
                )
            );
          },
          options.durationMs ??
            3200
        );
      },
      []
    );

  useEffect(() => {
    if (
      modal?.kind ===
      "prompt"
    ) {
      window.setTimeout(
        () => {
          inputRef.current?.focus();
          inputRef.current?.select();
        },
        0
      );
    }
  }, [modal]);

  useEffect(() => {
    if (!modal) {
      return;
    }

    function handleKeyDown(
      event:
        KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        if (
          modal.kind ===
          "confirm"
        ) {
          modal.resolve(
            false
          );
        } else {
          modal.resolve(
            null
          );
        }

        setModal(
          null
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [modal]);

  function closeConfirm(
    value: boolean
  ) {
    if (
      modal?.kind !==
      "confirm"
    ) {
      return;
    }

    modal.resolve(
      value
    );

    setModal(
      null
    );
  }

  function closePrompt(
    value:
      | string
      | null
  ) {
    if (
      modal?.kind !==
      "prompt"
    ) {
      return;
    }

    modal.resolve(
      value
    );

    setModal(
      null
    );
  }

  return (
    <StudioModalContext.Provider
      value={{
        confirm,
        prompt,
        notify,
      }}
    >
      {children}

      {modal && (
        <div
          className="studio-modal-backdrop"
          role="presentation"
          onMouseDown={(
            event
          ) => {
            if (
              event.target !==
              event.currentTarget
            ) {
              return;
            }

            if (
              modal.kind ===
              "confirm"
            ) {
              closeConfirm(
                false
              );
            } else {
              closePrompt(
                null
              );
            }
          }}
        >
          <div
            className={
              modal.kind ===
                "confirm" &&
              modal.options
                .tone ===
                "danger"
                ? "studio-modal studio-modal--danger"
                : "studio-modal"
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-modal-title"
          >
            <div className="studio-modal__eyebrow">
              Songwriter Studio
            </div>

            <h2
              id="studio-modal-title"
            >
              {
                modal.options
                  .title
              }
            </h2>

            {modal.options
              .message && (
              <p className="studio-modal__message">
                {
                  modal.options
                    .message
                }
              </p>
            )}

            {modal.kind ===
              "prompt" && (
              <input
                ref={
                  inputRef
                }
                className="studio-modal__input"
                value={
                  promptValue
                }
                placeholder={
                  modal.options
                    .placeholder ??
                  ""
                }
                onChange={(
                  event
                ) =>
                  setPromptValue(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    const value =
                      promptValue.trim();

                    closePrompt(
                      value ||
                        null
                    );
                  }
                }}
              />
            )}

            <div className="studio-modal__actions">
              <button
                type="button"
                onClick={() => {
                  if (
                    modal.kind ===
                    "confirm"
                  ) {
                    closeConfirm(
                      false
                    );
                  } else {
                    closePrompt(
                      null
                    );
                  }
                }}
              >
                {
                  modal.options
                    .cancelLabel ??
                  "Cancel"
                }
              </button>

              <button
                type="button"
                className={
                  modal.kind ===
                    "confirm" &&
                  modal.options
                    .tone ===
                    "danger"
                    ? "studio-modal__confirm studio-modal__confirm--danger"
                    : "studio-modal__confirm"
                }
                onClick={() => {
                  if (
                    modal.kind ===
                    "confirm"
                  ) {
                    closeConfirm(
                      true
                    );
                  } else {
                    const value =
                      promptValue.trim();

                    closePrompt(
                      value ||
                        null
                    );
                  }
                }}
              >
                {
                  modal.options
                    .confirmLabel ??
                  "Confirm"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="studio-toast-stack"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(
          (toast) => (
            <button
              type="button"
              key={
                toast.id
              }
              className={
                "studio-toast studio-toast--" +
                toast.tone
              }
              onClick={() =>
                setToasts(
                  (current) =>
                    current.filter(
                      (item) =>
                        item.id !==
                        toast.id
                    )
                )
              }
            >
              <strong>
                {
                  toast.title
                }
              </strong>

              {toast.message && (
                <span>
                  {
                    toast.message
                  }
                </span>
              )}
            </button>
          )
        )}
      </div>
    </StudioModalContext.Provider>
  );
}

export function useStudioModal() {
  const context =
    useContext(
      StudioModalContext
    );

  if (!context) {
    throw new Error(
      "useStudioModal must be used inside StudioModalProvider."
    );
  }

  return context;
}
