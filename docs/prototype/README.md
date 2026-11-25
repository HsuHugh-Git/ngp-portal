# 階段 0 原型：OpnForm 一次性代碼流程

## 這份原型驗證了什麼

**已驗證（`receiver.mjs` 加 `sim.mjs`，模擬 OpnForm 送出的 Webhook）**

| 情境 | 結果 |
| --- | --- |
| 簽章正確、代碼有效 | 建立申請 |
| 同一個 `submission_id` 重送 | 回傳既有申請，不重複建立 |
| 簽章錯誤 | 401 拒收 |
| 簽後竄改本文 | 401 拒收 |
| 代碼已使用、偽造、未帶 | 422 拒收 |
| 兩位申請人各自的代碼 | 各自建立，不會混淆 |

簽章格式依 OpnForm 原始碼（`AbstractIntegrationHandler::sendJsonWebhook`）：對**送出的原始 JSON 本文**做 HMAC-SHA256，標頭 `X-Webhook-Signature: sha256=<hex>`。接收端必須用原始位元組驗簽，不能先解析再重組。

**尚未驗證（OpnForm 本體在原型環境跑不起來）**

1. OpnForm 實際送出的 payload 是否與原始碼推論一致（隱藏欄位在 `data`、`submission_id` 存在）。
2. 網址預填隱藏欄位（前端行為，只有原始碼證據）。
3. Webhook 逾時 5 秒後是否重試、重試間隔。
4. 公開表單可直接送出時的行為（無代碼的送出會被接收端拒收，但 OpnForm 仍會存下紀錄）。
5. 免費版 2 帳號上限實際行為。

## 原型環境的限制
原型環境的網路政策只允許 git 代理，Composer 無法取得 GitHub 套件壓縮檔，PHP 套件裝不完。**在你自己的電腦或內部伺服器上用 Docker 跑才是實測的路。**

## 實測步驟（在有 Docker 的機器）
1. 取得 OpnForm：`git clone https://github.com/OpnForm/OpnForm`，依其 `docker-compose.yml` 與 `api/.env.docker`、`client/.env.docker` 啟動。
2. 建立表單「資訊需求申請單」：一個文字欄位「需求說明」，一個**隱藏欄位**名稱 `applicant_token`。
3. 在表單整合新增 Webhook：網址指向接收端（`node receiver.mjs`，需讓 OpnForm 容器連得到；OpnForm 要求公開網址，內網位址可能被其驗證規則擋下，這是要確認的一點），設定 secret，與接收端的 `WEBHOOK_SECRET` 相同。
4. 用接收端 `/token` 取得代碼，開啟 `表單網址?applicant_token=<代碼>`，填寫送出。
5. 檢查 `/tmp/receiver.log`：簽章是否通過、`applicant_token` 是否出現在 payload、`submission_id` 是否存在。
6. 重複送出、關閉接收端再送出，觀察 OpnForm 是否重試。

## 已由原始碼確認的 Webhook 網址限制
`PublicWebhookUrl`（`api/app/Service/Security/`）規定：
- 網址**一律必須是 HTTPS**，且不可含帳密，即使放寬私有位址也一樣。
- 預設主機名稱必須解析到**公開 IP**，內網位址（192.168.x.x、localhost）會被拒絕。
- 自架可設環境變數 `WEBHOOKS_ALLOW_PRIVATE_URLS=true`（設定檔 `config/opnform.php`）放寬內網限制。

對 ADR 0002 的影響：申請中心的接收端必須提供 **HTTPS**（內部憑證授權單位簽發，或經反向代理），且 OpnForm 需開啟 `WEBHOOKS_ALLOW_PRIVATE_URLS`。實測時要確認 OpnForm 容器信任該憑證。
