'use client'

import { useState } from 'react'

interface WhatsAppInputProps {
  defaultValue?: string
  placeholder?: string
}

export function WhatsAppInput({ defaultValue = '', placeholder = '812-3456-7890' }: WhatsAppInputProps) {
  // Format initial value if it exists
  const formatInitial = (val: string) => {
    let clean = val.replace(/\D/g, '')
    // Ensure it starts with 8 if not empty
    if (clean.length > 0 && clean[0] !== '8') {
      clean = '8' + clean.replace(/^0+/, '')
    }
    const match = clean.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/)
    if (match) {
      return !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? `-${match[3]}` : ''}`
    }
    // Fallback for longer numbers
    return clean.replace(/(\d{4})(?=\d)/g, '$1-')
  }

  const [value, setValue] = useState(formatInitial(defaultValue))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '')
    
    // Auto start with 8
    if (input.length > 0 && input[0] !== '8') {
      // If user typed 0, replace with 8. Or just prepend 8.
      if (input[0] === '0') {
        input = '8' + input.slice(1)
      } else {
        input = '8' + input
      }
    }

    // Format 4 digits - 4 digits - 4+ digits
    let formatted = input
    if (input.length > 4 && input.length <= 8) {
      formatted = `${input.slice(0, 4)}-${input.slice(4)}`
    } else if (input.length > 8) {
      formatted = `${input.slice(0, 4)}-${input.slice(4, 8)}-${input.slice(8)}`
    }

    setValue(formatted)
  }

  return (
    <input
      id="whatsapp"
      name="whatsapp"
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
    />
  )
}
