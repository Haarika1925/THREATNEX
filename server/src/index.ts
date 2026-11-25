import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { analyzeContent } from './engine.js'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.disable('x-powered-by')
app.use(helmet())
app.use(express.json({ limit: '16kb' }))
app.use('/api', rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many analysis requests. Please wait a minute and try again.' },
}))

const requestSchema = z.object({
  type: z.enum(['email', 'sms', 'url', 'voice']),
  input: z.string().trim().min(1).max(10_000),
})

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', engine: 'heuristics', externalReputation: false })
})

app.post('/api/analyze', (request, response) => {
  const parsed = requestSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: 'Provide a scan type and content within the allowed length.' })
    return
  }
  try {
    const result = analyzeContent(parsed.data.type, parsed.data.input)
    response.json({ result })
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : 'Analysis failed.' })
  }
})

app.listen(port, () => {
  console.log(`THREATNEX API listening on http://localhost:${port}`)
})
