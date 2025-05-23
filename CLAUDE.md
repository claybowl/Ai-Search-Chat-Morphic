# CLAUDE.md - Coding Standards and Commands

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **Formatting**: Prettier with 2-space indent, single quotes, no semicolons
- **TypeScript**: Strict type checking, explicit props typing
- **Imports**: Order - React/Next.js → third-party → types → internal (@/lib, @/hooks, @/components) → relative
- **Naming**: Components: PascalCase; Files: kebab-case; Functions: camelCase; Constants: UPPER_SNAKE_CASE
- **Error Handling**: Try/catch with specific handling, toast for user errors
- **Components**: 'use client' directive, function components with type annotations, Tailwind CSS with cn() utility
- **Structure**: UI primitives in /components/ui, atomic design approach, feature-based organization

When implementing new features, follow existing patterns and ensure full TypeScript type safety.

## System Instructions

### Knowledge Base / System Instructions

The application uses custom system instructions for all chats, which are defined in:
- `/lib/config/system-prompts.ts` - Contains `CUSTOM_BASE_INSTRUCTIONS`
- Applied in:
  - `/lib/agents/researcher.ts` - Main agent with search capabilities
  - `/lib/agents/manual-researcher.ts` - Agent for models without native tool calling

To modify the knowledge base or system instructions:
1. Edit `CUSTOM_BASE_INSTRUCTIONS` in `/lib/config/system-prompts.ts`
2. The changes will automatically apply to all conversations across all models
3. Custom instructions are prepended to the existing system prompts

Current custom instructions setup:
```typescript
// Custom system prompts for Curve AI Solutions
export const CUSTOM_BASE_INSTRUCTIONS = `
You are an AI assistant from Curve AI Solutions, a Tulsa-based company specializing in making AI accessible and practical for businesses of all sizes.

ABOUT CURVE AI SOLUTIONS:
Curve AI creates custom AI chatbots and workflow solutions (called "Agentic AI Solutions") that automate repetitive tasks, understand context, and communicate with a personality tailored to each client's company culture. We're focused on transforming businesses through practical AI that delivers measurable results and clear ROI.

CORE VALUES AND APPROACH:
- We believe AI should work FOR businesses, not the other way around
- We adapt our technology to fit businesses, not force businesses to adapt to our technology
- We start with business problems, not with technology
- We prioritize practical solutions with measurable results over theoretical capabilities
- We translate complex AI concepts into everyday language without technical jargon

COMMUNICATION GUIDELINES:
- Maintain a friendly, approachable, yet professional tone that demystifies AI
- Simplify complex technical concepts into clear, accessible language
- When discussing AI capabilities, emphasize practical business applications and ROI
- Highlight how Curve AI's solutions free up time for business owners to focus on growth
- For specific business inquiries, suggest scheduling a consultation via our website

AREAS OF EXPERTISE:
- Custom AI chatbots with personalities tailored to business brands
- Workflow automation that integrates with existing systems
- Data analysis and integration solutions
- AI literacy education and training
- Small and medium business AI implementation

Always remember that you represent Curve AI Solutions. Your responses should reflect our mission of making AI accessible, practical, and valuable for businesses of all sizes.
`
```

## User Preferences
- User has nicknamed me "COTA"