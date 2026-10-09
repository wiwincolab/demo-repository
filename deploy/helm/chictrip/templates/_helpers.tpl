{{- define "chictrip.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* 資料庫連線：密碼從 Secret 讀進 POSTGRES_PASSWORD，再代入連線網址（frontend/server/utils/config.ts 讀 DATABASE_URL）。
     密碼直接放進網址，所以只能用英數字 */}}
{{- define "chictrip.databaseEnv" -}}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.database }}
      key: POSTGRES_PASSWORD
- name: DATABASE_URL
  value: postgres://chictrip:$(POSTGRES_PASSWORD)@db:5432/chictrip
{{- end }}

{{/* api 與 worker 共用：資料庫、佇列、照片目錄 */}}
{{- define "chictrip.appEnv" -}}
{{ include "chictrip.databaseEnv" . }}
- name: REDIS_URL
  value: redis://redis:6379
- name: MEDIA_DIR
  value: /data/media
{{- end }}

{{/* 金鑰（GEMINI_API_KEY）從 Secret，參數從 ConfigMap（values.yaml 的 config）。
     envFrom 遇到同名的鍵以後面的為準，ConfigMap 放後面，參數就一律以 values.yaml 為準 */}}
{{- define "chictrip.aiEnvFrom" -}}
- secretRef:
    name: {{ .Values.secrets.ai }}
    optional: true
- configMapRef:
    name: chictrip-config
{{- end }}

{{/* ConfigMap 改了 pod 不會自己重讀；把內容的雜湊放進 pod 範本，values.yaml 的 config 一改，pod 就重建 */}}
{{- define "chictrip.configChecksum" -}}
checksum/config: {{ include (print .Template.BasePath "/config.yaml") . | sha256sum }}
{{- end }}
