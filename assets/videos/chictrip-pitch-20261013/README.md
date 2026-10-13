# 去趣提案簡報字幕影片

三段簡報依順序分別保存，並合成一支完整影片；影片已燒錄繁體中文字幕，可直接播放。

[完整合成版：3 分 19 秒，79 段字幕](chictrip-pitch-20261013-full.zh-TW.mp4) · [完整 SRT](subtitles-full.zh-TW.srt) · [完整 VTT](subtitles-full.zh-TW.vtt)

| 段落 | 字幕影片 | 可編輯字幕 |
|---|---|---|
| 第一段，約 75 秒：提案概述與痛點分析 | [MP4](chictrip-pitch-20261013.zh-TW.mp4) | [SRT](subtitles.zh-TW.srt)、[VTT](subtitles.zh-TW.vtt)、[ASS](subtitles.zh-TW.ass) |
| 第二段，約 59 秒：解決方案設計 | [MP4](chictrip-pitch-20261013-part2.zh-TW.mp4) | [SRT](subtitles-part2.zh-TW.srt)、[VTT](subtitles-part2.zh-TW.vtt)、[ASS](subtitles-part2.zh-TW.ass) |
| 第三段，約 65 秒：行銷策略、差異化與落地計畫 | [MP4](chictrip-pitch-20261013-part3.zh-TW.mp4) | [SRT](subtitles-part3.zh-TW.srt)、[VTT](subtitles-part3.zh-TW.vtt)、[ASS](subtitles-part3.zh-TW.ass) |

第一段來源為 `Screen Recording 2026-10-13 at 12.18.13 AM.mov`；第二段來源為 `和泰初賽簡報.pptx 的複本.mp4`；第三段來源為 `第三段.mp4`。

字幕依旁白轉寫，採繁體中文，並統一去趣、chicTrip、eSIM、和泰 Point 等名稱。三段沿用白字深色描邊。第一段字幕位於原有黑底，維持 2704 × 1756；第二段在 1920 × 1080 畫面下方增加 72px 字幕區，輸出為 1920 × 1152；第三段使用原有黑底，維持 1146 × 720。各段保留原始音訊。

合成版依第一、第二、第三段排序。去除錄影外側黑邊後，簡報統一為 1920 × 1080，下方加上 72px 字幕區，輸出 1920 × 1152、30 fps。三段音量對齊約 -16 LUFS，使用 48 kHz 立體聲 AAC；字幕時間碼隨接合點平移。完整片長為 198.933 秒，段落開始時間分別為 0、75.033、134.367 秒。接合時只補齊不足一格的畫面與靜音，保留全部旁白。詳細時間與音量參數見 [merge-info.json](merge-info.json)。

修改對應的 SRT 後，在此目錄執行 [render.py](render.py)，重新產生 VTT、ASS 與字幕影片：

原始錄影保留在本機。重新製作時，將三段原始影片放在此目錄，依序命名為 `source.mov`、`source-part2.mp4`、`source-part3.mp4`。

```sh
python3 render.py
python3 render.py --part 2
python3 render.py --part 3
python3 merge.py
```

前三行各自處理第一、第二、第三段；[merge.py](merge.py) 以原始錄影及 SRT 重製完整合成版，沿用第二段 ASS 的字幕樣式。需要 Python 3、包含 libass 與 libx264 的 FFmpeg，以及支援繁體中文的 `Heiti TC` 字型；其他系統可修改 `render.py` 的字型名稱。影片使用 H.264／AAC、30 fps。
