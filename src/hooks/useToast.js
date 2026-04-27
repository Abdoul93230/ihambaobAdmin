// hooks/useToast.js
import React, { useState, useCallback, createContext, useContext } from 'react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from '../components/ui/toast'

// Contexte pour les toasts
const ToastContext = createContext()

// Provider pour les toasts
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = {
      id,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-remove après 5 secondes par défaut
    const duration = toast.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const dismissToast = useCallback((id) => {
    removeToast(id)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      dismissToast,
    }}>
      <RadixToastProvider>
        {children}
        {/* Toaster intégré directement dans le provider */}
        {toasts.map(function ({ id, title, description, action, variant, ...props }) {
          return (
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
          )
        })}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  )
}

// Hook personnalisé
export const useToast = () => {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast } = context

  const toast = useCallback((props) => {
    return addToast(props)
  }, [addToast])

  return {
    toast,
    ...context,
  }
}