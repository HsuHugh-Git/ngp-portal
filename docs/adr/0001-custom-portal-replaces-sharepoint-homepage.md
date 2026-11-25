# 自建 Portal 取代 SharePoint 首頁，內容留在 SharePoint

首頁需要找人、我的今天（待我簽核、我的申請進度）、發電量等會動的資料，SharePoint 原生區塊做不到，且員工要在同一處簽核與看進度。決定以 Next.js（TypeScript）＋ PostgreSQL 自建 Portal，申請中心作為其中一個模組。公告（SharePoint 新聞）與文件庫仍留在 SharePoint，Portal 透過 Microsoft Graph 讀取，沿用各部門既有發布方式與到期日規則。

**Considered Options**：SharePoint 頁面＋自寫 SPFx 元件（可保留 SharePoint 使用分析，但簽核與進度頁仍要另做）；全部內容搬進自建後台（工程量過大）。

**Consequences**：SharePoint 網站使用分析不再適用，每日開啟人數與區塊點擊數需在 Portal 自行埋點。
