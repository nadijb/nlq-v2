'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-3">
      <div className="typing-dot w-2 h-2 bg-primary rounded-full" />
      <div className="typing-dot w-2 h-2 bg-primary rounded-full" />
      <div className="typing-dot w-2 h-2 bg-primary rounded-full" />
    </div>
  )
}
