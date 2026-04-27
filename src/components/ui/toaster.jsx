// components/ui/toaster.jsx
import React from 'react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast'
import { useToast } from '../../hooks/useToast'

export function Toaster() {
  const { toasts, dismissToast } = useToast()

  return (
    <RadixToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose onClick={() => dismissToast(id)} />
        </Toast>
      ))}
      <ToastViewport />
    </RadixToastProvider>
  )
}