// 同一個映像跑兩種角色：api 收請求；worker（CHICTRIP_ROLE=worker）另外處理照片標類別與每日卡片的佇列。
// worker 也照常開 HTTP，readinessProbe 打 /health 就知道它連得到資料庫
export default defineNitroPlugin(nitroApp => {
    const config = readConfig();
    if (config.role !== 'worker') return;
    const worker = startCreationWorker(config);
    nitroApp.hooks.hook('close', () => worker.close());
});
