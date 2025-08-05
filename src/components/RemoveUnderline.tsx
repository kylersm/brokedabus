import type { PropsWithChildren } from "react";

export default function RemoveUnderline(props: PropsWithChildren) {
  return <div className="inline-block remove-underline whitespace-pre-wrap">{props.children}</div>;
}