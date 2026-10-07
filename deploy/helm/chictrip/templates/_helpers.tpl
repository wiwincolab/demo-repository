{{- define "chictrip.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* 資料庫連線：密碼從 Secret 讀進 POSTGRES_PASSWORD，再代入連線網址（frontend/server/utils/db.ts 讀 DATABASE_URL）。
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
