#!/usr/bin/env bash
# 產生測試用自簽憑證（只用於這次測試，用完隨專案刪除）
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p certs && cd certs
openssl genrsa -out ca.key 2048 2>/dev/null
openssl req -x509 -new -key ca.key -sha256 -days 7 -subj "/CN=opnform-test-ca" -out ca.crt
openssl genrsa -out server.key 2048 2>/dev/null
openssl req -new -key server.key -subj "/CN=receiver" -out server.csr
printf "subjectAltName=DNS:receiver\n" > san.ext
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -days 7 -sha256 -extfile san.ext -out server.crt 2>/dev/null
# 容器內系統 CA 檔 = 主機系統 CA + 測試 CA
cat /etc/ssl/certs/ca-certificates.crt ca.crt > ca-bundle.crt
chmod 600 ca.key server.key
echo "完成：$(pwd)"
