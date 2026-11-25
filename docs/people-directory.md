# 找人資料來源（草案）

## 決定
- Portal 讀**資料倉儲的白名單 view**，不直接讀 AD／Entra ID，也不串 Cisco UCM。
- 分機的唯一真相是 AD `telephoneNumber`（IT 依 Excel 配號手動填入），CUCM 由 LDAP 同步跟隨，Portal 不需接 CUCM。
- 核准人（直屬主管）以 Femas HR 為準，AD 不一致時提醒 IT（見 data-model.md）。

## 資料流
Femas／AD 經既有 ETL 每日落地 `raw_staging`，再正規化為 `mart_hr.base_ad`、`base_femas`。Portal 以專用唯讀帳號讀取新建的白名單 view。資料延遲約一天。

## 白名單欄位（建議）
姓名、部門、職稱、分機、公司信箱、辦公室。**不外露**：Femas 手機、員編以外的個資、任何 `odoo_raw` 個資欄位。

## 必須處理
- 離職重雇在 Femas 有重複列：取 `working` 優先，排除同信箱或同姓名仍在職的舊離職列。
- 非人員帳號（共用信箱、會議室、`V` 開頭虛擬帳號）排除。
- AD `employee_id` 歷史上缺漏，員編可能需由 `description` 解析（`base_ad` 已處理）。

## 待確認
- 資料倉儲開唯讀帳號給 Portal 的授權與網路連通。
- 辦公室對應：員編首字 A／B／C 只對應台北／台中／台南，**嘉義**如何表示。
- 照片來源（資料倉儲沒有），座位資料來源（目前只有 PDF）。
- 找人搜尋是否含離職保留期內的人（預設不含）。
