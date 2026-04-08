import { buildPokerPrompt } from './pokerPrompt.js'

const BASE_URL = 'https://api.anthropic.com/v1/messages'
const MODEL    = 'claude-sonnet-4-6'
const VERSION  = '2023-06-01'

export class RateLimitError extends Error {
  constructor() { super('Rate limited') }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message || `API error ${status}`)
    this.status = status
  }
}

/**
 * Send a base64 JPEG frame to Claude and return the raw response text.
 * Throws RateLimitError on 429, ApiError on other non-2xx responses.
 */
export async function analyzePokerFrame(base64Jpeg, apiKey) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': VERSION,
      // Required for direct browser calls — without this header the API
      // returns a CORS error for browser-origin requests.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Jpeg,
              },
            },
            {
              type: 'text',
              text: buildPokerPrompt(),
            },
          ],
        },
      ],
    }),
  })

  if (response.status === 429) throw new RateLimitError()
  if (!response.ok) {
    let msg
    try { msg = (await response.json()).error?.message } catch (_) {}
    throw new ApiError(response.status, msg)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? null
}
