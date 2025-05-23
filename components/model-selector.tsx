'use client'

import { Model } from '@/lib/types/models'
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { isReasoningModel } from '@/lib/utils/registry'
import { Check, ChevronsUpDown, Lightbulb, Search, Zap, Brain, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createModelId } from '../lib/utils'
import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'

// Function to group models by category
function groupModelsByCategory(models: Model[]) {
  const enabledModels = models.filter(model => model.enabled)
  const categorized = enabledModels.reduce((groups, model) => {
    const category = model.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(model)
    return groups
  }, {} as Record<string, Model[]>)
  
  // Define category order
  const categoryOrder = ['Speed', 'Quality', 'Reasoning', 'Linguistic', 'Other']
  
  // Create a sorted result
  const result: Record<string, Model[]> = {}
  categoryOrder.forEach(category => {
    if (categorized[category] && categorized[category].length > 0) {
      result[category] = categorized[category]
    }
  })
  
  return result
}

// Helper function to get the icon for a category
function getCategoryIcon(category: string) {
  switch (category) {
    case 'Speed':
      return <Zap className="h-5 w-5 text-green-500" />
    case 'Quality':
      return <Lightbulb className="h-5 w-5 text-purple-500" />
    case 'Reasoning':
      return <Brain className="h-5 w-5 text-blue-500" />
    case 'Linguistic':
      return <MessageSquare className="h-5 w-5 text-amber-500" />
    default:
      return <Lightbulb className="h-5 w-5 text-gray-500" />
  }
}

interface ModelSelectorProps {
  models: Model[]
}

export function ModelSelector({ models }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [activeCategoryMenu, setActiveCategoryMenu] = useState<string | null>(null)

  useEffect(() => {
    const savedModel = getCookie('selectedModel')
    if (savedModel) {
      try {
        const model = JSON.parse(savedModel) as Model
        setValue(createModelId(model))
      } catch (e) {
        console.error('Failed to parse saved model:', e)
      }
    }
  }, [])

  const handleModelSelect = (id: string) => {
    const newValue = id === value ? '' : id
    setValue(newValue)
    
    const selectedModel = models.find(model => createModelId(model) === newValue)
    if (selectedModel) {
      setCookie('selectedModel', JSON.stringify(selectedModel))
    } else {
      setCookie('selectedModel', '')
    }
    
    setOpen(false)
    setShowCategoryMenu(false)
  }

  const handleCategoryClick = (category: string) => {
    if (activeCategoryMenu === category) {
      setActiveCategoryMenu(null)
    } else {
      setActiveCategoryMenu(category)
    }
  }

  const selectedModel = models.find(model => createModelId(model) === value)
  const groupedModels = groupModelsByCategory(models)
  
  // Function to render the categorized model list
  const renderCategorizedModelList = () => {
    return (
      <div className="absolute left-0 right-0 top-0 bg-background rounded-lg shadow-lg z-50 p-2 max-w-md mx-auto">
        <div className="grid gap-2">
          {Object.entries(groupedModels).map(([category, categoryModels]) => (
            <div key={category} className="rounded-md overflow-hidden">
              <button 
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted text-left"
                onClick={() => handleCategoryClick(category)}
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <div>
                    <div className="font-medium">{category}</div>
                    <div className="text-xs text-muted-foreground">
                      {categoryModels[0]?.description || `${category} models`}
                    </div>
                  </div>
                </div>
                <div className={`${activeCategoryMenu === category ? 'bg-accent-blue-foreground/10' : ''} px-2 py-1 text-xs rounded-full ${activeCategoryMenu === category ? 'text-accent-blue-foreground' : 'text-muted-foreground'}`}>
                  {activeCategoryMenu === category ? 'New' : ''}
                </div>
              </button>
              
              {activeCategoryMenu === category && (
                <div className="p-2 bg-background border-t">
                  {categoryModels.map(model => {
                    const modelId = createModelId(model)
                    return (
                      <button
                        key={modelId}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                          value === modelId && "bg-accent-blue-foreground/10 text-accent-blue-foreground"
                        )}
                        onClick={() => handleModelSelect(modelId)}
                      >
                        <div className="flex items-center gap-2">
                          <Image
                            src={`/providers/logos/${model.providerId}.svg`}
                            alt={model.provider}
                            width={16}
                            height={16}
                            className="bg-white rounded-full border"
                          />
                          <span className="text-xs font-medium">{model.name}</span>
                        </div>
                        {value === modelId && <Check className="h-4 w-4" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs w-full"
            onClick={() => setShowCategoryMenu(false)}
          >
            Cancel
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="ml-2 text-xs flex items-center gap-1"
            onClick={() => setOpen(true)}
          >
            <Search className="h-3 w-3" />
            Search Models
          </Button>
        </div>
      </div>
    )
  }

  // Original dropdown selector
  const renderClassicSelector = () => {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="text-sm rounded-full shadow-none focus:ring-0"
          >
            {selectedModel ? (
              <div className="flex items-center space-x-1">
                <Image
                  src={`/providers/logos/${selectedModel.providerId}.svg`}
                  alt={selectedModel.provider}
                  width={18}
                  height={18}
                  className="bg-white rounded-full border"
                />
                <span className="text-xs font-medium">{selectedModel.name}</span>
                {isReasoningModel(selectedModel.id) && (
                  <Lightbulb size={12} className="text-accent-blue-foreground" />
                )}
              </div>
            ) : (
              'Select model'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search models..." />
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              {Object.entries(groupedModels).map(([category, models]) => (
                <CommandGroup key={category} heading={category}>
                  {models.map(model => {
                    const modelId = createModelId(model)
                    return (
                      <CommandItem
                        key={modelId}
                        value={modelId}
                        onSelect={handleModelSelect}
                        className="flex justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Image
                            src={`/providers/logos/${model.providerId}.svg`}
                            alt={model.provider}
                            width={18}
                            height={18}
                            className="bg-white rounded-full border"
                          />
                          <span className="text-xs font-medium">
                            {model.name}
                          </span>
                        </div>
                        <Check
                          className={`h-4 w-4 ${
                            value === modelId ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="relative">
      {/* Toggle between the two interfaces */}
      {!open && (
        <Button
          variant="outline"
          size="sm"
          className="text-sm rounded-full shadow-none focus:ring-0 flex items-center space-x-1"
          onClick={() => setShowCategoryMenu(!showCategoryMenu)}
        >
          {selectedModel ? (
            <div className="flex items-center space-x-1">
              <Image
                src={`/providers/logos/${selectedModel.providerId}.svg`}
                alt={selectedModel.provider}
                width={18}
                height={18}
                className="bg-white rounded-full border"
              />
              <span className="text-xs font-medium">{selectedModel.name}</span>
              {isReasoningModel(selectedModel.id) && (
                <Lightbulb size={12} className="text-accent-blue-foreground" />
              )}
            </div>
          ) : (
            'Select model'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      )}
      
      {/* Show the categorized menu if toggled */}
      {showCategoryMenu && renderCategorizedModelList()}
      
      {/* Keep the classic selector for search capability */}
      {open && renderClassicSelector()}
    </div>
  )
}