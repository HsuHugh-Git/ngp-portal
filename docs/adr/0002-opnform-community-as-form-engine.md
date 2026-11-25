# OpnForm 免費自架版只當表單引擎，簽核與進度由申請中心自建

OpnForm 沒有簽核與流程進度，且免費自架版全實例僅限 2 個帳號（建表單者），Enterprise 授權為專有。決定以免費版負責填表與收件，簽核、進度、結果全在申請中心。申請人身分由申請中心產生一次性代碼，放進網址預填的隱藏欄位，Webhook 回來時以代碼還原申請人，不信任表單內填的姓名。

**Considered Options**：SharePoint 清單＋Power Automate（授權內可用，但簽核不在「系統內」）；Power Automate Premium 接 Webhook（自建後端後不再需要）；Zammad／Budibase（功能完整但多維運一套系統）。

**Consequences**：需實測隱藏欄位預填、Webhook 逾時（5 秒）與重送、直接送出無代碼的紀錄拒收。2 帳號上限只算建表單者，員工填公開表單不算。

**附件**：附件留在 OpnForm 儲存空間。Webhook 給的是限時簽名連結，不可存入資料庫；使用者點附件時，申請中心先檢查權限，再以服務金鑰向 OpnForm 取檔轉送。服務金鑰需占用一個 OpnForm 帳號，因此免費版 2 個帳號為「表單維護者一個、服務帳號一個」，IT 同仁需共用維護者帳號。日後更換表單引擎時，附件需另行搬遷。

**Webhook 網址限制**（原始碼確認）：OpnForm 要求 Webhook 網址為 HTTPS，且預設只接受公開 IP。申請中心接收端須提供 HTTPS，並在 OpnForm 設定 `WEBHOOKS_ALLOW_PRIVATE_URLS=true` 才能指向內網位址。
