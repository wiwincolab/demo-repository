#!/usr/bin/env bash
# 在 care-vm 上準備 chicTrip 的部署環境（一次性）：namespace、部署帳號、對外網址、GitHub Actions runner。
# 做法照 MEDDEMO 的 deploy/setup-runner.sh，但權限收得更緊，因為這個 repo 是公開的，而 care-vm 同時跑 CARE 的正式環境：
#   - MEDDEMO 的 runner 在 k3s 群組，讀得到整個叢集的管理員 kubeconfig；這裡的 runner 只拿到 chictrip namespace 的權限，
#     讀不到 CARE、MEDDEMO 的 Secret
#   - Ingress 由這支腳本用管理員權限建立，部署帳號只能看不能改：能建 Ingress 就能把 CARE 的網域導走
#   - namespace 套用 Pod Security 的 baseline：不能開 privileged 或掛 VM 的目錄，部署帳號無法藉 pod 拿到整台 VM
#   - sudo 只開一支固定內容的拉映像腳本，參數先驗證過，不是 MEDDEMO 那樣開放 crictl pull 帶任意參數
#
# 用法（在 VM 上，需要 sudo）：
#   1. GitHub → wiwincolab/demo-repository → Settings → Actions → Runners → New self-hosted runner，
#      複製設定指令裡的 token（一次性，一小時內有效）
#   2. sudo bash setup-vm.sh --token <token>
# 重跑是安全的：namespace、權限、Ingress、拉映像腳本都會覆寫成同樣的設定；runner 已註冊過就不必再給 token。
set -euo pipefail

REPO_URL="https://github.com/wiwincolab/demo-repository"
NAMESPACE="chictrip"
HOST="chictrip.jamessu2016.com"
RUNNER_USER="chictrip-runner"
RUNNER_NAME="chictrip-gcp-vm"
# deploy job 用 runs-on: [self-hosted, Linux, chictrip] 挑這台
RUNNER_LABELS="self-hosted,Linux,chictrip"
# 跟 care-vm 上 CARE、MEDDEMO 的 runner 同一版
RUNNER_VERSION="2.337.0"
INSTALL_DIR="/opt/chictrip-runner"
PULL_SCRIPT="/usr/local/sbin/chictrip-pull-images"
SUDOERS_FILE="/etc/sudoers.d/chictrip-runner"
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

REG_TOKEN=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --token) REG_TOKEN="$2"; shift 2 ;;
    *) echo "未知參數：$1" >&2; exit 1 ;;
  esac
done
[[ "$(id -u)" -eq 0 ]] || { echo "請用 sudo 執行" >&2; exit 1; }
for cmd in k3s kubectl helm; do
  command -v "$cmd" >/dev/null || { echo "找不到 $cmd：這台 VM 還沒裝好 K3s 與 Helm" >&2; exit 1; }
done
if [[ ! -f "$INSTALL_DIR/.runner" && -z "$REG_TOKEN" ]]; then
  echo "runner 還沒註冊，請用 --token 給註冊碼（GitHub 的 New self-hosted runner 頁面）" >&2
  exit 1
fi

echo "==> 建立 namespace ${NAMESPACE}（Pod Security: baseline）"
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
  labels:
    pod-security.kubernetes.io/enforce: baseline
EOF

echo "==> 建立只能動 ${NAMESPACE} 的部署帳號"
# Helm 把每一版的紀錄存成 Secret，--wait 要看 Deployment／StatefulSet／pod 的狀態，所以這幾類都要能讀寫。
# 沒有 namespace、Ingress、RBAC 本身的寫入權限，也碰不到其他 namespace
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployer
  namespace: ${NAMESPACE}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployer
  namespace: ${NAMESPACE}
rules:
  - apiGroups: [""]
    resources: [pods, pods/log, pods/exec, services, configmaps, secrets, persistentvolumeclaims]
    verbs: ["*"]
  - apiGroups: [""]
    resources: [events, endpoints]
    verbs: [get, list, watch]
  - apiGroups: [apps]
    resources: [deployments, statefulsets, replicasets]
    verbs: ["*"]
  - apiGroups: [batch]
    resources: [jobs, cronjobs]
    verbs: ["*"]
  - apiGroups: [networking.k8s.io]
    resources: [ingresses]
    verbs: [get, list, watch]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployer
  namespace: ${NAMESPACE}
subjects:
  - kind: ServiceAccount
    name: deployer
    namespace: ${NAMESPACE}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deployer
---
apiVersion: v1
kind: Secret
metadata:
  name: deployer-token
  namespace: ${NAMESPACE}
  annotations:
    kubernetes.io/service-account.name: deployer
type: kubernetes.io/service-account-token
EOF

echo "==> 建立對外網址 ${HOST}"
# 手機 ─HTTPS→ Cloudflare（橘雲）─→ VM 的 443 ─→ K3s 內建的 Traefik ─→ web（Nginx）。
# HTTPS 憑證用 kube-system 裡 TLSStore 的預設憑證（Cloudflare Origin 憑證，涵蓋 *.jamessu2016.com），這裡不必設 tls。
# 優先權跟 MEDDEMO 一樣給 200：CARE 的 Ingress 不指定網域、什麼都收，它的 /health 明訂優先權 100，
# 不拉高的話這個網域的 /health 會被 CARE 的後端接走
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
  namespace: ${NAMESPACE}
  annotations:
    traefik.ingress.kubernetes.io/router.priority: "200"
spec:
  ingressClassName: traefik
  rules:
    - host: ${HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
EOF

echo "==> 建立 runner 帳號 ${RUNNER_USER}（不加入 k3s 群組）"
id "$RUNNER_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash "$RUNNER_USER"
runner_home="$(getent passwd "$RUNNER_USER" | cut -d: -f6)"

echo "==> 寫入部署帳號的 kubeconfig"
token=""
for _ in $(seq 1 30); do
  token="$(kubectl -n "$NAMESPACE" get secret deployer-token -o jsonpath='{.data.token}' 2>/dev/null | base64 -d || true)"
  [[ -n "$token" ]] && break
  sleep 1
done
[[ -n "$token" ]] || { echo "deployer-token 一直沒有產生 token" >&2; exit 1; }
ca="$(kubectl -n "$NAMESPACE" get secret deployer-token -o jsonpath='{.data.ca\.crt}')"
install -d -m 0700 -o "$RUNNER_USER" -g "$RUNNER_USER" "$runner_home/.kube"
umask 077
cat >"$runner_home/.kube/config" <<EOF
apiVersion: v1
kind: Config
clusters:
  - name: care-vm
    cluster:
      server: https://127.0.0.1:6443
      certificate-authority-data: ${ca}
users:
  - name: deployer
    user:
      token: ${token}
contexts:
  - name: ${NAMESPACE}
    context:
      cluster: care-vm
      user: deployer
      namespace: ${NAMESPACE}
current-context: ${NAMESPACE}
EOF
chown "$RUNNER_USER:$RUNNER_USER" "$runner_home/.kube/config"
umask 022

echo "==> 安裝拉映像腳本 ${PULL_SCRIPT}"
# GHCR 是私有的，映像要用 deploy job 的短期 token 先拉進 K3s（pod 之後用 IfNotPresent 直接沿用）；
# K3s 的 containerd 只有 root 能操作，所以 runner 要透過 sudo 執行這支。token 從標準輸入讀，不出現在 sudo 的紀錄裡
cat >"$PULL_SCRIPT" <<'EOF'
#!/usr/bin/env bash
# 由 demo-repository/deploy/setup-vm.sh 產生。用法：echo "$TOKEN" | sudo chictrip-pull-images <GitHub 帳號> <commit SHA>
set -euo pipefail
actor="${1:-}"
sha="${2:-}"
[[ "$actor" =~ ^[A-Za-z0-9-]+(\[bot\])?$ ]] || { echo "GitHub 帳號格式不對：$actor" >&2; exit 2; }
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "commit SHA 格式不對：$sha" >&2; exit 2; }
IFS= read -r token
for name in web api; do
  /usr/local/bin/k3s crictl pull --creds "$actor:$token" "ghcr.io/wiwincolab/chictrip-$name:$sha"
done
EOF
chmod 0755 "$PULL_SCRIPT"
chown root:root "$PULL_SCRIPT"

tmp="$(mktemp)"
cat >"$tmp" <<EOF
# 由 demo-repository/deploy/setup-vm.sh 產生
${RUNNER_USER} ALL=(root) NOPASSWD: ${PULL_SCRIPT}
EOF
# sudoers 語法錯誤會讓整台機器無法 sudo，先驗證再裝
visudo -cqf "$tmp"
install -m 0440 -o root -g root "$tmp" "$SUDOERS_FILE"
rm -f "$tmp"

if [[ -f "$INSTALL_DIR/.runner" ]]; then
  echo "==> runner 已經註冊過，不重裝"
else
  echo "==> 下載 actions-runner ${RUNNER_VERSION} 到 ${INSTALL_DIR}"
  mkdir -p "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  curl -fsSLO "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf "actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  rm -f "actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  chown -R "$RUNNER_USER:$RUNNER_USER" "$INSTALL_DIR"

  echo "==> 註冊 runner（labels: ${RUNNER_LABELS}）"
  sudo -u "$RUNNER_USER" ./config.sh --url "$REPO_URL" --token "$REG_TOKEN" \
    --name "$RUNNER_NAME" --labels "$RUNNER_LABELS" --unattended --replace

  echo "==> 安裝成 systemd 服務"
  ./svc.sh install "$RUNNER_USER"
  ./svc.sh start
fi

echo "==> 檢查部署帳號的權限"
as_runner=(sudo -u "$RUNNER_USER" env KUBECONFIG="$runner_home/.kube/config")
"${as_runner[@]}" kubectl auth can-i create deployments -n "$NAMESPACE"
if "${as_runner[@]}" kubectl auth can-i get secrets -n care-dev >/dev/null 2>&1; then
  echo "部署帳號讀得到 care-dev 的 Secret，權限設錯了" >&2
  exit 1
fi
echo "完成。到 GitHub → demo-repository → Settings → Actions → Runners 確認 ${RUNNER_NAME} 是 Idle。"
