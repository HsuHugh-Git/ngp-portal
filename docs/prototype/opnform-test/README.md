# OpnForm 一次性代碼流程：主機測試包

目的：在一個**獨立的 compose 專案**驗證 `docs/prototype/README.md` 列出的「尚未驗證」項目。對照既有慣例（正式區／`dev/` 並存、`docker compose` 管理），只綁 127.0.0.1、不掛載主機目錄、用完拆掉。

> 這包檔案是我在沒有 Docker 的環境寫的，**沒有實際跑過**。`docker-compose.override.yml` 的 `!override` 語法需要較新的 Docker Compose，信任測試憑證的做法（覆蓋容器內 `/etc/ssl/certs/ca-certificates.crt`）也是推論，這兩處若失敗，是預期內要回報的結果。

## 0. 動手前先檢查（主機上）
```bash
docker compose version
ss -ltn | grep -E ':(18090|14443)\b' || echo "埠可用"
docker ps --format '{{.Names}}' | grep -i opnform || echo "沒有既有 opnform 容器"
```
`docker/nginx.conf` 寫死容器名稱 `opnform-client`、`opnform-api`；既有容器若同名會衝突。

## 1. 取得程式並放入測試包
```bash
sudo mkdir -p /opt/opnform_test && cd /opt/opnform_test
git clone https://github.com/OpnForm/OpnForm.git && cd OpnForm
# 把本資料夾的 docker-compose.override.yml、gen-certs.sh、receiver/ 複製到這裡
./gen-certs.sh
export WEBHOOK_SECRET="$(openssl rand -hex 16)"   # 不要貼到聊天或文件；回報時只說「已設定」
```

## 2. 啟動
```bash
./scripts/docker-setup.sh --public-url http://localhost:18090
docker compose ps
```
`--public-url` 用 `localhost:18090` 是因為要用 SSH 轉埠從你的電腦看：
```bash
ssh -L 18090:127.0.0.1:18090 -L 14443:127.0.0.1:14443 <主機別名>
```
然後瀏覽器開 `http://localhost:18090`，註冊第一個帳號（這是免費版 2 個帳號中的第 1 個）。

## 3. 建立測試表單
1. 新增表單「資訊需求申請單」，加一個文字欄位「需求說明」。
2. 加一個欄位名稱 **`applicant_token`**，設為**隱藏**。
3. 表單整合 → 新增 Webhook：網址 `https://receiver:4443/webhook`，secret 填步驟 1 的 `WEBHOOK_SECRET`。
4. 儲存後記下兩個欄位的**欄位 ID**（網址預填用的是欄位 ID，不是名稱；表單分享頁的「URL 預填」功能可以產生範例網址）。

## 4. 測試清單
取代碼（在主機上）：
```bash
curl -sk "https://127.0.0.1:14443/token?applicant=wang.xiaoming"
```

| # | 動作 | 預期 | 回報什麼 |
| --- | --- | --- | --- |
| 1 | 開 `http://localhost:18090/forms/<slug>?<隱藏欄位ID>=<代碼>`，隱藏欄位有被預填嗎（表單畫面看不到，可由送出後的 payload 判斷） | 送出後 receiver 收到 `hasToken: true` | `docker compose logs receiver` 中該筆事件 |
| 2 | 看 `/log` 的 `fieldNames`、`topLevelKeys`、`submission_id` | 含 `applicant_token`、`submission_id` | 該事件的 JSON（測試資料，無個資） |
| 3 | 再用同一個代碼送出一次 | 422 `invalid token` | 事件 |
| 4 | 不帶代碼，直接開表單網址送出 | 422 | 事件，以及 OpnForm 是否仍存下該筆 |
| 5 | `docker compose stop receiver` 後送出，再 `start`，等數分鐘 | 看 OpnForm 是否重試、間隔多久 | `docker compose logs api-worker` 與 receiver 事件時間 |
| 6 | 送出後看 OpnForm 是否曾對**同一個 submission** 重送 | 若有，receiver 應回 `dedup` | 事件 |
| 7 | 在 OpnForm 嘗試新增第 2、第 3 個使用者 | 第 3 個被拒（2 帳號上限） | 畫面訊息 |
| 8 | 對 receiver 發一筆簽章錯誤的請求 | 401 | 事件 |

## 5. 回報時請貼
- `docker compose ps` 輸出
- `curl -sk https://127.0.0.1:14443/log`（整份，應只含測試資料）
- 失敗時的 `docker compose logs api api-worker receiver --tail 100`
- **不要貼**：`WEBHOOK_SECRET`、`api/.env`、`certs/*.key`、任何 `.env` 內容。

## 6. 拆除
```bash
docker compose down -v
cd /opt && sudo rm -rf /opt/opnform_test
```
`-v` 會刪掉這個專案的 volume。拆完用 `docker ps -a` 和 `docker volume ls` 確認沒有 `opnform_test_*` 殘留。
