"use client"

import * as React from "react"

// Custom hook for Toast system
type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

const useToast = () => {
  const toast = (props: ToastProps) => {
    // Create a simple div-based toast
    const toastDiv = document.createElement("div")
    toastDiv.className = "fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border rounded-md shadow-md p-4 min-w-[300px] max-w-sm animate-in fade-in duration-500"
    
    // Add styles based on variant
    if (props.variant === "destructive") {
      toastDiv.classList.add("bg-red-50", "border-red-300", "text-red-700", "dark:bg-red-900/30", "dark:border-red-800", "dark:text-red-400")
    } else {
      toastDiv.classList.add("bg-gray-50", "border-gray-200", "text-gray-900", "dark:bg-gray-800", "dark:border-gray-700", "dark:text-gray-100")
    }
    
    // Create toast content
    const contentDiv = document.createElement("div")
    contentDiv.className = "flex flex-col"
    
    // Add title if provided
    if (props.title) {
      const titleSpan = document.createElement("span")
      titleSpan.className = "font-semibold text-sm"
      titleSpan.textContent = props.title
      contentDiv.appendChild(titleSpan)
    }
    
    // Add description if provided
    if (props.description) {
      const descSpan = document.createElement("span")
      descSpan.className = "text-sm mt-1"
      descSpan.textContent = props.description
      contentDiv.appendChild(descSpan)
    }
    
    // Close button
    const closeButton = document.createElement("button")
    closeButton.className = "absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    closeButton.innerHTML = "×"
    closeButton.addEventListener("click", () => {
      document.body.removeChild(toastDiv)
    })
    
    // Append elements
    toastDiv.appendChild(contentDiv)
    toastDiv.appendChild(closeButton)
    document.body.appendChild(toastDiv)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toastDiv)) {
        document.body.removeChild(toastDiv)
      }
    }, 5000)
  }
  
  return { toast }
}

export { useToast } 