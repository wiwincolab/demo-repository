#!/usr/bin/env bash
# 在已跑過 setup-vm.sh 的 care-vm 上，以 root 安裝額外 runner。
# token 從 stdin 讀取，避免出現在 shell history；不重跑叢集初始化。
set -euo pipefail
index="${1:-2}"
[[ "$index" =~ ^[2-8]$ ]] || { echo 'runner 編號必須為 2–8' >&2; exit 2; }
[[ "$(id -u)" -eq 0 ]] || { echo '請用 sudo 執行' >&2; exit 1; }
runner_user=chictrip-runner
runner_dir="/opt/chictrip-runner-${index}"
runner_name="chictrip-gcp-vm-${index}"
version=2.337.0
id "$runner_user" >/dev/null
[[ -f /home/chictrip-runner/.kube/config && -x /usr/local/sbin/chictrip-pull-images ]] || {
  echo '請先完成 setup-vm.sh；缺少部署帳號或拉映像腳本' >&2; exit 1;
}
# 防止兩個安裝程序同時操作同一個 runner 目錄。
exec 9>"/var/lock/chictrip-runner-${index}.lock"
flock -n 9 || { echo '此 runner 正在安裝' >&2; exit 1; }
if [[ -f "$runner_dir/.runner" ]]; then
  cd "$runner_dir"
  ./svc.sh status
  echo "${runner_name} 已註冊；不覆蓋現有 runner。"
  exit 0
fi
IFS= read -r token
[[ -n "$token" ]] || { echo 'stdin 缺少一次性註冊 token' >&2; exit 2; }
archive="$(mktemp)"
trap 'rm -f "$archive"' EXIT
curl --fail --location --retry 3 --max-time 180 \
  "https://github.com/actions/runner/releases/download/v${version}/actions-runner-linux-x64-${version}.tar.gz" -o "$archive"
install -d -o "$runner_user" -g "$runner_user" "$runner_dir"
tar xzf "$archive" -C "$runner_dir"
chown -R "$runner_user:$runner_user" "$runner_dir"
cd "$runner_dir"
# 與第一個 runner 使用相同的 namespace 權限、標籤，但目錄和服務名稱獨立。
# 不使用 --replace，避免意外取代正在工作的 runner。
sudo -u "$runner_user" ./config.sh \
  --url https://github.com/wiwincolab/demo-repository \
  --token "$token" --name "$runner_name" --labels chictrip --work _work --unattended
unset token
./svc.sh install "$runner_user"
./svc.sh start
./svc.sh status
