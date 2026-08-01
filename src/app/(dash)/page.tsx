import { StarsBackground } from "animate-ui";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      <StarsBackground className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to GMA</h1>
        <p className="text-sm text-muted-foreground">Your admin panel is ready</p>
      </div>
    </div>
  );
}
