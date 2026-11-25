import crypto from 'node:crypto'
const SECRET=process.env.WEBHOOK_SECRET, B='http://127.0.0.1:4000'
if(!SECRET){console.error('請先設定環境變數 WEBHOOK_SECRET（與 receiver 相同）');process.exit(1)}
const sign=(raw,s=SECRET)=>'sha256='+crypto.createHmac('sha256',s).update(raw).digest('hex')
// 與 OpnForm 相同：JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES（JS 的 JSON.stringify 預設即不跳脫中文與斜線）
const payload=(sid,tok)=>JSON.stringify({form_id:1,form_title:'資訊需求申請單',form_slug:'it-request',submission_id:sid,
  data:{a:{value:'需要新螢幕 /24吋',name:'需求說明',type:'text'},t:{value:tok,name:'applicant_token',type:'text'}},message:'deprecated'})
async function send(raw,sig){const r=await fetch(B+'/webhook',{method:'POST',headers:{'content-type':'application/json','x-webhook-signature':sig},body:raw});return [r.status,(await r.text())]}
const out=[]
const t=(await (await fetch(B+'/token',{method:'POST',body:JSON.stringify({applicant:'wang.xiaoming'})})).json()).token
let raw=payload('sub-1',t)
out.push(['1 正常送出',...await send(raw,sign(raw))])
out.push(['2 同一筆重送(去重)',...await send(raw,sign(raw))])
out.push(['3 簽章錯誤',...await send(raw,sign(raw,'wrong-secret-xxxxxx'))])
raw=payload('sub-2',t)
out.push(['4 代碼已使用過(新送出)',...await send(raw,sign(raw))])
raw=payload('sub-3','deadbeef')
out.push(['5 偽造代碼',...await send(raw,sign(raw))])
raw=payload('sub-4','')
out.push(['6 未帶代碼',...await send(raw,sign(raw))])
const t2=(await (await fetch(B+'/token',{method:'POST',body:JSON.stringify({applicant:'li.daming'})})).json()).token
raw=payload('sub-5',t2)
out.push(['7 竄改本文(簽後改字)',...await send(raw.replace('新螢幕','新主機'),sign(raw))])
out.push(['8 第二位申請人正常',...await send(raw,sign(raw))])
for(const o of out)console.log(o.join(' | '))
