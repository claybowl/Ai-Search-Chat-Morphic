'use client'

import { cn } from '@/lib/utils'
import { Zap, Brain, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from './ui/button'

const examples = [
  'Tell me about Curve AI Solutions',
  'How do agentic AI solutions work?',
  'What sets Curve AI apart from other companies?',
  'What industries can benefit from Curve AI?'
]

export function CategoryButton({
  icon,
  label,
  description,
  isNew = false,
  onClick
}: {
  icon: React.ReactNode
  label: string
  description: string
  isNew?: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      className="h-auto flex flex-col items-start gap-1 p-4 text-left"
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        {isNew && (
          <span className="text-xs bg-accent-blue-foreground/10 px-2 py-0.5 rounded-full text-accent-blue-foreground">
            New
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Button>
  )
}

export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'mt-8 rounded-lg border bg-background p-8 animate-in fade-in',
        className
      )}
    >
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Models by Capability
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <CategoryButton
          icon={<Zap className="h-5 w-5 text-green-500" />}
          label="Speed"
          description="Snappy responses with impressive capabilities."
          onClick={() => {}}
        />
        <CategoryButton
          icon={<Sparkles className="h-5 w-5 text-purple-500" />}
          label="Quality"
          description="High quality for complex business tasks."
          isNew={true}
          onClick={() => {}}
        />
        <CategoryButton
          icon={<Brain className="h-5 w-5 text-blue-500" />}
          label="Reasoning"
          description="Strong reasoning and problem-solving abilities."
          onClick={() => {}}
        />
        <CategoryButton
          icon={<MessageSquare className="h-5 w-5 text-amber-500" />}
          label="Linguistic"
          description="Excellence with nuanced language tasks."
          onClick={() => {}}
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-3">Try asking about:</h3>
        <div className="grid gap-2">
          {examples.map((example, i) => (
            <Button
              key={i}
              variant="secondary"
              className="justify-start text-left h-auto"
              onClick={() => submitMessage(example)}
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}