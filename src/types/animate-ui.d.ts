declare module "animate-ui" {
  import type * as React from "react";

  export const StarsBackground: React.ComponentType<
    React.ComponentProps<"div"> & {
      factor?: number;
      speed?: number;
      starColor?: string;
      pointerEvents?: boolean;
    }
  >;

  interface PlayfulTodolistProps {
    tasks: { id: string | number; title: string; completed: boolean }[];
    onToggle?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
  }

  export const PlayfulTodolist: React.ComponentType<PlayfulTodolistProps>;
}
