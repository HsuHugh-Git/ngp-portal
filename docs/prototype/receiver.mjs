// 模擬「申請中心」的 Webhook 接收端：驗簽章、驗一次性代碼、以 submission_id 去重
import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'

const SECRET = process.env.WEBHOOK_SECRET
if (!SECRET) { console.error('請先設定環境變數 WEBHOOK_SECRET'); process.exit(1) }
const PORT = Number(process.env.PORT || 4000)
const LOG = process.env.LOG || '/tmp/receiver.log'
const tokens = new Map()      // token -> { applicant, used }
const requests = new Map()    // submission_id -> request
const log = (o) => fs.appendFileSync(LOG, JSON.stringify(o) + '\n')

const server = http.createServer((req, res) => {
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const raw = Buffer.concat(chunks)
    if (req.method === 'POST' && req.url === '/token') {
      const { applicant } = JSON.parse(raw.toString() || '{}')
      const t = crypto.randomBytes(16).toString('hex')
      tokens.set(t, { applicant, used: false })
      res.end(JSON.stringify({ token: t }))
      return
    }
    if (req.method === 'POST' && req.url === '/webhook') {
      const sig = req.headers['x-webhook-signature'] || ''
      const expect = 'sha256=' + crypto.createHmac('sha256', SECRET).update(raw).digest('hex')
      const sigOk = sig.length === expect.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))
      let body = {}
      try { body = JSON.parse(raw.toString()) } catch {}
      const sid = body.submission_id
      const tokenField = Object.values(body.data || {}).find((f) => f.name === 'applicant_token')?.value
      const entry = log({ at: Date.now(), sigOk, sid, tokenField, headers: { sig }, keys: Object.keys(body) })
      if (!sigOk) { res.statusCode = 401; return res.end('bad signature') }
      if (!sid) { res.statusCode = 400; return res.end('no submission_id') }
      if (requests.has(sid)) { res.statusCode = 200; return res.end(JSON.stringify({ dedup: true, request: requests.get(sid) })) }
      const t = tokens.get(tokenField)
      if (!t || t.used) { log({ reject: 'invalid-or-used-token', sid }); res.statusCode = 422; return res.end('invalid token') }
      t.used = true
      const r = { id: requests.size + 1, applicant: t.applicant, sid }
      requests.set(sid, r)
      log({ created: r })
      res.end(JSON.stringify({ created: r }))
      return
    }
    res.statusCode = 404; res.end()
  })
})
server.listen(PORT, '127.0.0.1', () => console.log('receiver on', PORT))
