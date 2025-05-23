'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="currentColor"></circle>
      <path 
        d="M128 48C83.8 48 48 83.8 48 128s35.8 80 80 80c19.7 0 37.8-7.2 51.7-19C164.3 176.3 144 146.5 144 112c0-14.2 3.2-27.7 8.9-39.8C144.6 52.2 136.7 48 128 48z" 
        fill="white"
      ></path>
      <path 
        d="M169.8 64.2C164.1 76.3 160.9 89.8 160.9 104c0 34.5 20.3 64.3 35.7 77c14-14.3 21.4-33.7 21.4-53c0-44.2-35.8-80-80-80c-1.4 0-2.8 0-4.2 0.1C147.4 50.8 159.5 55.9 169.8 64.2z" 
        fill="white"
        opacity="0.7"
      ></path>
    </svg>
  )
}

export { IconLogo }
