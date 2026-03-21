import { motion } from 'framer-motion'
import { type UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ActionCard, type ActionType } from './ActionCard'
import { DataCard, isDataTool } from './DataCard'
import { OniAvatar } from '@/components/ui/OniAvatar'

interface Props {
  message: UIMessage
  onQuickAction?: (text: string) => void
}

const ACTION_TYPES = new Set([
  'request_swap', 'request_follow', 'request_unfollow',
  'request_deposit_more', 'request_withdraw',
  'request_register_leader', 'request_deregister',
  'request_claim_fees', 'request_approve',
])

function SafeLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  const isSafe = href?.startsWith('https://') || href?.startsWith('http://')
  if (!isSafe) return <span>{children}</span>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#c4389a] underline underline-offset-2 hover:text-secondary transition-colors">
      {children}
    </a>
  )
}

function getToolName(part: { type: string; toolName?: string }): string {
  if (part.type.startsWith('tool-')) return part.type.slice(5)
  if ('toolName' in part && part.toolName) return part.toolName
  return ''
}

/** Strip hallucinated XML/HTML tags (e.g. <ActionCard .../>) from LLM text */
function sanitizeText(text: string): string {
  return text.replace(/<\/?[A-Z][A-Za-z]*[^>]*\/?>/g, '').trim()
}

export function ChatMessage({ message, onQuickAction }: Props) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="mb-5"
    >
      {isUser ? (
        <div className="flex justify-end">
          <div className="max-w-[75%] bg-secondary text-white rounded-xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
            {message.parts.map((part, i) => {
              if (part.type === 'text') return <span key={`text-${i}`}>{part.text}</span>
              return null
            })}
          </div>
        </div>
      ) : (
        <div className="flex gap-3 items-start">
          <OniAvatar size="sm" bare className="mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            {(() => {
              // Track if a card (DataCard/ActionCard) was rendered — text after a card is usually
              // the LLM echoing the same data, so we suppress it
              let cardRendered = false

              return message.parts.map((part, i) => {
                if (part.type === 'text') {
                  // Skip text that comes after a card — it's just the LLM repeating data
                  if (cardRendered) return null

                  const cleaned = sanitizeText(part.text)
                  if (!cleaned) return null
                  const hasRichContent = /\|.*\|/.test(cleaned) || cleaned.includes('```')
                  return (
                    <div
                      key={`text-${i}`}
                      className={`bg-primary/15 border border-primary/30 rounded-xl rounded-tl-sm px-4 py-3 ${hasRichContent ? 'max-w-full' : 'max-w-[90%]'}`}
                    >
                      <div className="text-text text-sm leading-relaxed chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: SafeLink }}>
                          {cleaned}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )
                }

                // Tool result parts
                if (part.type === 'tool-invocation' || (part.type as string).startsWith('tool-')) {
                  const toolName = getToolName(part as { type: string; toolName?: string })

                  // Action tools render as ActionCards
                  if (ACTION_TYPES.has(toolName)) {
                    const output = 'result' in part ? part.result : 'output' in part ? (part as { output: unknown }).output : null
                    if (output && typeof output === 'object' && 'type' in (output as Record<string, unknown>)) {
                      cardRendered = true
                      return (
                        <ActionCard
                          key={`action-${i}`}
                          data={output as { type: ActionType } & Record<string, unknown>}
                          onQuickAction={onQuickAction}
                        />
                      )
                    }
                    return null
                  }

                  // Data tools render as DataCards
                  if (isDataTool(toolName)) {
                    const output = 'result' in part ? part.result : 'output' in part ? (part as { output: unknown }).output : null
                    if (output && typeof output === 'object') {
                      cardRendered = true
                      return <DataCard key={`data-${i}`} toolName={toolName} data={output as Record<string, unknown>} />
                    }
                  }

                  // Other read tools: hidden
                  return null
                }

                return null
              })
            })()}
          </div>
        </div>
      )}
    </motion.div>
  )
}
