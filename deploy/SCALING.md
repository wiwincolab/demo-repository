# Runner 與背景工作擴充

背景 worker 預設為 2 個 Pod，每個同時處理 4 件，共 8 件。Helm 的
`worker.replicas` 控制副本數，`config.WORKER_CONCURRENCY` 控制單一 Pod 並行數。
BullMQ 使用共同 Redis 佇列與固定 jobId 分派、去重；它仍可能在工作失去鎖或程序故障時重試，並非 exactly-once。
保留 Recreate 更新策略，避免新舊版本一起處理工作；更新時會短暫停止消費，但佇列保留。
每個 worker 有 CPU、記憶體 requests/limits 與 120 秒終止寬限。
media 是 local-path 的 ReadWriteOnce PVC，此配置支援同節點多 Pod，不是跨 VM 擴充。

## 安裝第二個部署 runner

先在 care-vm 完成原有 `setup-vm.sh`。將 `add-runner.sh` 複製到 VM，取得
GitHub Settings → Actions → Runners 的一次性註冊 token 後，在 VM 執行：

```bash
read -rsp '一次性 runner token: ' runner_token; echo
printf '%s\n' "$runner_token" | sudo bash deploy/add-runner.sh 2
unset runner_token
```

第二個服務名稱為 `chictrip-gcp-vm-2`，工作目錄是 `/opt/chictrip-runner-2`。
兩個 runner 共用現有受限部署帳號；不新增 sudo 或 Kubernetes 權限。
GitHub Actions 可選任一空閒 runner，但 production 部署仍受現有
`concurrency.group: deploy-production`、`cancel-in-progress: false` 控制，不能重疊。
增加服務不等於增加 VM 的 CPU、網路或容錯能力，也不會加快序列化的正式部署。
只推送此腳本不會自動安裝 runner，必須在 VM 執行以上命令。

## 驗證與回復

```bash
helm lint deploy/helm/chictrip
helm template chictrip deploy/helm/chictrip --set image.tag=ci
kubectl -n chictrip get deployment worker
kubectl -n chictrip get pods -l app=worker
```

部署完成後應看到 worker 的 READY 為 `2/2`，GitHub Runners 頁面應有兩個 online runner。
要恢復單一 worker，把 `worker.replicas` 改回 1 並走正常部署。
要停用第二個 runner，在它 idle 時進入 `/opt/chictrip-runner-2` 執行
`sudo ./svc.sh stop`；原 runner 不受影響。
