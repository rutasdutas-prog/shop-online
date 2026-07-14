'use client'

import React from 'react'

interface AddToCartButtonProps {
  productId: string
  productName: string
  price: number
  image?: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  title?: string
}

export function AddToCartButton({ productId, productName, price, image, className, style, children, title }: AddToCartButtonProps) {
  return (
    <button 
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('cart-direct-add', {
          detail: {
            productId,
            productName,
            price,
            image,
            quantity: 1
          }
        }))
      }}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </button>
  )
}
