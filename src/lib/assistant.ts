// Client de l'assistant IA (route serveur api/assistant.ts).
// La clé Groq et le contexte (profil, projets…) restent côté serveur :
// le navigateur n'envoie que la conversation.

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const OPEN_EVENT = 'assistant:open'

/** Ouvre la fenêtre de l'assistant depuis n'importe quel bouton du site. */
export function openAssistant(question?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: question }))
}

export function onAssistantOpen(handler: (question?: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string | undefined>).detail)
  window.addEventListener(OPEN_EVENT, listener)
  return () => window.removeEventListener(OPEN_EVENT, listener)
}

export class AssistantError extends Error {}

/**
 * Envoie la conversation et lit la réponse en streaming (SSE au format OpenAI, renvoyé par Groq).
 * `onDelta` reçoit chaque morceau de texte au fur et à mesure.
 */
export async function askAssistant(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null) as { error?: string } | null
    throw new AssistantError(body?.error ?? 'Assistant indisponible pour le moment.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Chaque événement SSE est une ligne "data: {...}"
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const payload = line.trim()
      if (!payload.startsWith('data:')) continue
      const data = payload.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) onDelta(delta)
      } catch {
        // morceau JSON incomplet : ignoré, la suite arrive dans le prochain paquet
      }
    }
  }
}
