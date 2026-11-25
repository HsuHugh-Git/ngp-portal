// 模擬「申請中心」Webhook 接收端（HTTPS）：驗簽章、驗一次性代碼、以 submission_id 去重
import https from 'node:https'
import crypto from 'node:crypto'
import fs from 'node:fs'

const SECRET = process.env.WEBHOOK_SECRET
const PORT = Number(process.env.PORT || 4443)
if (!SECRET || SECRET.length < 12) { console.error('WEBHOOK_SECRET 至少 12 字元'); process.exit(1) }

const tokens = new Map()    // token -> { applicant, used }
const requests = new Map()  // submission_id -> request
const events = []           // 最近的事件，供 GET /log
const note = (o) => { const e = { at: new Date().toISOString(), ...o }; events.push(e); if (events.length > 200) events.shift(); console.log(JSON.stringify(e)) }

const server = https.createServer(
  { key: fs.readFileSync('server.key'), cert: fs.readFileSync('server.crt') },
  (req, res) => {
    const url = new URL(req.url, 'https://x')
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks)
      const json = (code, o) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)) }

      if (req.method === 'GET' && url.pathname === '/token') {
        const applicant = url.searchParams.get('applicant') || 'test.user'
        const token = crypto.randomBytes(16).toString('hex')
        tokens.set(token, { applicant, used: false })
        return json(200, { token, applicant })
      }
      if (req.method === 'GET' && url.pathname === '/log') return json(200, events)

      if (req.method === 'POST' && url.pathname === '/webhook') {
        const got = String(req.headers['x-webhook-signature'] || '')
        const expect = 'sha256=' + crypto.createHmac('sha256', SECRET).update(raw).digest('hex')
        const sigOk = got.length === expect.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expect))
        let body = {}
        try { body = JSON.parse(raw.toString()) } catch { /* 非 JSON */ }
        const fields = Object.values(body.data || {})
        const sid = body.submission_id
        const tokenField = fields.find((f) => f.name === 'applicant_token')?.value
        note({
          event: 'webhook-received', sigOk, sigHeaderPresent: got !== '',
          submission_id: sid ?? null, topLevelKeys: Object.keys(body),
          fieldNames: fields.map((f) => f.name), hasToken: !!tokenField, bytes: raw.length,
        })
        if (!sigOk) return json(401, { error: 'bad signature' })
        if (!sid) return json(400, { error: 'no submission_id' })
        if (requests.has(sid)) { note({ event: 'dedup', submission_id: sid }); return json(200, { dedup: true, request: requests.get(sid) }) }
        const t = tokens.get(tokenField)
        if (!t || t.used) { note({ event: 'rejected', reason: 'invalid-or-used-token', submission_id: sid }); return json(422, { error: 'invalid token' }) }
        t.used = true
        const r = { id: requests.size + 1, applicant: t.applicant, submission_id: sid }
        requests.set(sid, r)
        note({ event: 'created', request: r })
        return json(200, { created: r })
      }
      json(404, { error: 'not found' })
    })
  },
)
server.listen(PORT, '0.0.0.0', () => console.log('receiver (https) on', PORT))
