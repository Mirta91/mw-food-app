import { type CmsState, describeCmsState } from "@/lib/cms/state";

export function CmsStatus({ state }: { state: CmsState }) {
  const { title, detail } = describeCmsState(state);
  return (
    <main data-cms-state={state.kind}>
      <h1>{title}</h1>
      <p>{detail}</p>
    </main>
  );
}
