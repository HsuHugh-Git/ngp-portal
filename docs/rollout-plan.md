# 分階段上線計畫（草案）

取代原規劃文件中以 SharePoint 為前提的「P1／P2／P3」排程。決策背景見 [adr/](adr/)，資料與規則見 [data-model.md](data-model.md)、[notifications.md](notifications.md)、[people-directory.md](people-directory.md)。

## 順序原則
先讓全員有每天打開的理由並建好登入與後端（階段 1），申請中心接在後面（階段 2）。一人加 AI 開發，一次只推進一條主線。

## 階段 0：驗證（開工前，失敗就要改架構）

| 項目 | 通過條件 |
| --- | --- |
| OpnForm 一次性代碼流程 | 接收端邏輯已用模擬 Webhook 驗證（見 `prototype/README.md`）。**OpnForm 本體實測尚待在有 Docker 的機器完成**：隱藏欄位預填、payload 內容、逾時與重送、內網 HTTPS Webhook |
| Entra Application Proxy | Business Premium 授權可用，內部伺服器可安裝連接器，外網可登入 |
| 資料倉儲唯讀帳號 | IT 開專用帳號，Portal 伺服器到資料倉儲網路可通 |
| Graph 權限 | 應用程式註冊與管理員同意（讀 SharePoint、行事曆、寄信） |
| IT 需求類別 | 因 it-ticket 已不用，向 IT 確認目前實際受理哪些類型的需求，以及哪些需簽核 |
| 共用信箱 | IT 建立供通知寄件 |

## 階段 1：Portal 骨架與找人

- Next.js 加 PostgreSQL，Entra ID 單一登入，部署於內部伺服器並經 Application Proxy 發布
- Intune 將 Portal 設為 Edge 起始頁
- 首頁：找人（資料倉儲白名單 view）、系統入口、常用表單連結、公告與文件庫（Graph 讀 SharePoint）、今日發電量
- 舊內容搬遷與下架（個人 OneDrive 連結清零、短網址換直接連結、過期內容下架）
- **Portal 自己的使用分析**：每日開啟人數、各區塊點擊數（取代 SharePoint 分析，必須在本階段完成）
- 檢查點：連續兩週每日開啟人數佔比、找人使用量、首頁過期內容數為 0

## 階段 2：申請中心

- 資訊需求申請單（OpnForm）、一次性代碼、Webhook 接收與去重
- 簽核（單層，Femas 直屬主管）、進度、結案結果、退回補件與否決
- 通知（Outlook）與每日彙整催簽、假日表沿用 `mart_hr.tw_public_holidays`
- IT 處理端、需求類別後台、附件經申請中心轉送
- Odoo it-ticket 已不再使用，無需退場與資料搬遷
- 檢查點：先以 IT 內部小範圍試跑一至二週，再開放全員

## 階段 3：我的今天與其他

- 首頁「我的今天」：待我簽核、我的申請進度、今日會議、今天請假同仁
- 新人報到、壽星與到職週年（生日需同仁同意）、會議室空檔
- 其他表單電子化（例如用印申請，需先確認現行流程）
- 座位圖：等辦公室搬遷定案後再做
- Teams 通知（第二期）

## 成效指標
沿用原文件，但量測方式改為 Portal 自己的分析：每日開啟人數佔員工總數、各區塊點擊數、首頁過期內容數（目標 0）、個人 OneDrive 連結數（目標 0）、詢問分機與找人的電話與訊息量。新增：簽核平均等待時間、IT 申請平均結案天數。

## 風險
- 一人開發，階段 2 工作量最大，需預留緩衝並避免同時推兩條主線。
- 自建 Portal 後，SharePoint 使用分析失效，需自行埋點。
- OpnForm 免費版 2 帳號上限與專有授權界線，需持續留意。
- 上游資料（Femas 主管、AD 分機）品質直接影響找人與簽核。

## 待確認
- 各階段預計時程與你可投入的時間。
- 是否有硬性期限（辦公室搬遷、Odoo 授權到期）。
- Odoo it-ticket：**已不再使用，不匯入、不保留、無切換日問題**。
