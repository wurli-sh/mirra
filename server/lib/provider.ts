import { createOllama } from 'ollama-ai-provider-v2'
import { createGroq } from '@ai-sdk/groq'

const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'ollama'

export function getModels() {
  if (LLM_PROVIDER === 'groq') {
    const groqProvider = createGroq({ apiKey: process.env.GROQ_API_KEY })
    const primary = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant'
    return [
      groqProvider(primary),
      groqProvider('llama-3.3-70b-versatile'),
    ]
  }

  const ollamaProvider = createOllama({
    baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/api',
  })
  const model = process.env.OLLAMA_MODEL ?? 'qwen3:8b'
  return [ollamaProvider(model)]
}
