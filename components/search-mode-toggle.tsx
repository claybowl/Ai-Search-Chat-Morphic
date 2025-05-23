'use client'

import { cn } from '@/lib/utils'
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { Globe, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Toggle } from './ui/toggle'

export function SearchModeToggle() {
  const [isSearchMode, setIsSearchMode] = useState(true)

  useEffect(() => {
    const savedMode = getCookie('search-mode')
    if (savedMode !== null) {
      setIsSearchMode(savedMode === 'true')
    }
  }, [])

  const handleSearchModeChange = (pressed: boolean) => {
    setIsSearchMode(pressed)
    setCookie('search-mode', pressed.toString())
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'text-sm rounded-full shadow-none focus:ring-0 flex items-center gap-1',
        isSearchMode && 'bg-accent-blue text-accent-blue-foreground border-accent-blue-border'
      )}
      onClick={() => handleSearchModeChange(!isSearchMode)}
    >
      <Search className="h-4 w-4" />
      <span className="text-xs">Search</span>
    </Button>
  )
}