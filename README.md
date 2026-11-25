# NGP Portal 員工入口網站

新版 NGP Portal 的規劃與原型。目標是讓 Portal 成為員工每天第一個打開的工作入口，並在系統內完成申請、簽核、看進度與結果。

## 目前狀態（2026-11-25）
規劃階段完成，進入**階段 0：驗證**。尚未開始正式開發。

## 文件導覽
| 檔案 | 內容 |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | 詞彙表（申請、簽核、核准人、進度等的定義） |
| [docs/adr/](docs/adr/) | 架構決策紀錄 |
| [docs/data-model.md](docs/data-model.md) | 申請中心資料模型與進度流轉 |
| [docs/notifications.md](docs/notifications.md) | 通知與催簽規則 |
| [docs/people-directory.md](docs/people-directory.md) | 找人資料來源 |
| [docs/rollout-plan.md](docs/rollout-plan.md) | 分階段上線計畫 |
| [docs/prototype/](docs/prototype/) | OpnForm 一次性代碼流程的原型與主機測試包 |

## 主要決策摘要
- 自建 Portal（Next.js＋PostgreSQL），取代 SharePoint 首頁；公告與文件庫留在 SharePoint，經 Microsoft Graph 讀取。
- 申請中心為 Portal 的模組；OpnForm 免費自架版只當表單引擎，申請人身分用一次性代碼。
- 部署於公司內部伺服器，以 Entra Application Proxy 對外發布，Entra ID 單一登入。
- 找人讀資料倉儲的白名單 view；核准人以 Femas HR 直屬主管為準。
- 第一個試點表單：資訊需求申請單。

## 下一步（階段 0）
1. 在主機上依 [docs/prototype/opnform-test/README.md](docs/prototype/opnform-test/README.md) 實測 OpnForm。
2. 請 IT：資料倉儲唯讀帳號、Application Proxy 可用性、需求類別清單、通知用共用信箱。
3. 確認嘉義辦公室在員工資料中的表示方式。
