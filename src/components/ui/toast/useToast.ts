import { useToastStore, type ToastType } from "./toastStore";

interface ShowToastOptions {
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  const add = useToastStore((s) => s.add);
  const remove = useToastStore((s) => s.remove);

  const showToast = (opts: ShowToastOptions) => {
    return add(opts);
  };

  const dismiss = (id: string) => remove(id);

  return { showToast, dismiss };
}
