'use client'

import React from 'react'

interface AddToCartButtonProps {
  productName: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  title?: string
}

export function AddToCartButton({ productName, className, style, children, title }: AddToCartButtonProps) {
  return (
    <button 
      onClick={() => {
        window.dispatchEvent(new CustomEvent('ai-cart-add', { detail: { productName } }))
      }}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </button>
  )
}
