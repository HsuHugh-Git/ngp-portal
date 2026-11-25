# 部署於內部伺服器，以 Entra Application Proxy 對外發布

資料與服務留在公司內部伺服器／虛擬機，但主管出差、在家與手機也要能簽核。決定以 Entra Application Proxy 發布到外網，登入由 Entra ID 把關，不開放防火牆入站。

**Consequences**：需向 IT 確認 Business Premium 的 Entra ID P1 可用 Application Proxy，且內部伺服器能安裝連接器；備份、憑證與四個據點的網路連通由 IT 負責。
