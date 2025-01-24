import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AlertDialog({ children, open, onOpenChange }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        {children}
        <Button
          className="absolute top-2 right-2"
          onClick={() => onOpenChange(false)}
        >
          ✖️
        </Button>
      </div>
    </div>
  );
}

export function AlertDialogTrigger({ children, onOpenChange }) {
  return (
    <div
      onClick={() => {
        onOpenChange(true); // Ouvre le modal
      }}
    >
      {children}
    </div>
  );
}

export function AlertDialogContent({ children }) {
  return <div className="grid gap-4">{children}</div>;
}

export function AlertDialogHeader({ children }) {
  return <div className="flex flex-col space-y-2">{children}</div>;
}

export function AlertDialogTitle({ children }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function AlertDialogDescription({ children }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function AlertDialogFooter({ children }) {
  return <div className="flex justify-end space-x-2">{children}</div>;
}

export function AlertDialogAction({ children, onClick }) {
  return (
    <Button onClick={onClick} variant="default">
      {children}
    </Button>
  );
}

export function AlertDialogCancel({ children, onClick }) {
  return (
    <Button onClick={onClick} variant="outline">
      {children}
    </Button>
  );
}
