"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type ToastProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof toastVariants> & {
    onClose?: () => void
  }

function Toast({ className, variant, onClose, ...props }: ToastProps) {
  return (
    <div
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex-1 flex rtl:flex-row-reverse gap-2">
        {props.children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:hover:text-red-300 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">إغلاق</span>
        </button>
      )}
    </div>
  )
}

type ToastActionProps = React.ButtonHTMLAttributes<HTMLButtonElement>

function ToastAction({ className, ...props }: ToastActionProps) {
  return (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
        className
      )}
      {...props}
    />
  )
}

type ToastTitleProps = React.HTMLAttributes<HTMLHeadingElement>

function ToastTitle({ className, ...props }: ToastTitleProps) {
  return <h2 className={cn("font-semibold", className)} {...props} />
}

type ToastDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

function ToastDescription({ className, ...props }: ToastDescriptionProps) {
  return <p className={cn("text-sm opacity-90", className)} {...props} />
}

type ToastProviderProps = {
  children: React.ReactNode
}

function ToastProvider({ children, ...props }: ToastProviderProps) {
  return (
    <div
      className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      {...props}
    >
      {children}
    </div>
  )
}

// Use Toast Hook

type CreateToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

let toastCount = 0

function createToast(props: CreateToastProps) {
  const id = `toast-${toastCount++}`
  const toast = document.createElement("div")
  toast.id = id
  toast.className = "toast-notification"
  toast.setAttribute("role", "alert")
  
  // Create toast content
  const toastContent = document.createElement("div")
  toastContent.className = cn(
    toastVariants({ variant: props.variant }),
    "mx-auto mb-4"
  )
  
  // Add title if provided
  if (props.title) {
    const title = document.createElement("h2")
    title.className = "font-semibold"
    title.textContent = props.title
    toastContent.appendChild(title)
  }
  
  // Add description if provided
  if (props.description) {
    const description = document.createElement("p")
    description.className = "text-sm opacity-90"
    description.textContent = props.description
    toastContent.appendChild(description)
  }
  
  toast.appendChild(toastContent)
  
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "toast-container"
    toastContainer.className = "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    document.body.appendChild(toastContainer)
  }
  
  toastContainer.appendChild(toast)
  
  // Remove toast after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, 5000)
  
  return {
    id,
    dismiss: () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }
  }
}

function useToast() {
  return {
    toast: createToast
  }
}

export {
  Toast,
  ToastAction,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  useToast,
  toastVariants
} 