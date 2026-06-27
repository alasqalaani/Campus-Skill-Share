import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border text-foreground shadow-lg rounded-xl",
          title: "font-semibold",
          description: "text-muted-foreground text-sm",
          error: "bg-destructive/10 border-destructive/30 text-destructive",
          success: "bg-primary/10 border-primary/30",
        },
      }}
    />
  );
}
