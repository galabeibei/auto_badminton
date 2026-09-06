# 🏸 羽中遨翔 — 羽球排點系統

一個給羽球團練 / 揪團活動使用的免費排點（配對上場）小工具。純前端網頁，不需要伺服器、不需要登入，開啟即可用。

依 ELO 風格積分自動配對對戰組合、依候位順序保證公平輪替、盡量避免同一批人重複組隊，並提供「輔助模式」（系統一次補一場建議）與「自動模式」（系統一次規劃好幾輪）兩種排點策略。

> 這是原始 [`badminton/`](../) 專案的重寫版本。完整的功能規格與架構設計說明請見 [`docs/SPEC.md`](./docs/SPEC.md) 與 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)。

## 功能特色

- 三種對戰模式：相近 (A)、平衡 (B)、混合 (C，自動依場次數平衡兩者比例)
- 兩種系統策略：輔助模式（Assist，即時填補）、自動模式（Auto，批次規劃 Session）
- 選手名單支援手動新增、文字貼上匯入、CSV 檔案上傳、Google 試算表連結匯入、一鍵產生測試選手
- 手動分組、拖點交換選手、系統建議「換一組」、Auto 模式的「系統自動微調」
- 語音報名上場（瀏覽器原生 Text-to-Speech）
- 完整的積分升降、勝率、等待時間、同隊/對戰次數統計，以及比賽歷史紀錄
- 瀏覽器重新整理不會遺失資料（自動存檔於 localStorage，重新載入時可選擇回復）

## 開發

需要 [Node.js](https://nodejs.org/)（建議 18 以上版本）。

```bash
npm install       # 安裝套件
npm run dev       # 啟動開發伺服器 (http://localhost:5173)
npm test          # 執行測試 (Vitest)
npm run build     # 建置正式版靜態檔案到 dist/
npm run preview   # 預覽建置後的成果
npm run lint      # 執行 ESLint 檢查
```

## 專案結構

```
src/
├── domain/     # 純商業邏輯（排點演算法、ELO 計算、CSV 解析…），不依賴 React，可獨立測試
├── state/      # 應用程式狀態機（單一 reducer + localStorage 持久化）
├── hooks/      # 連接 domain 與 React 生命週期的橋樑
├── components/ # 共用 UI 元件（ui / player / match / stats / modals）
└── screens/    # 7 個精靈流程畫面（首頁 → 場地 → 模式 → 策略 → 名單 → 比賽大廳 → 結算）
```

詳細分層原則與各檔案職責說明請見 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)。

## 部署到 GitHub Pages

本專案已內建 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)，設定完成後每次 push 到 `main` 分支會自動建置並部署。

1. Fork 或建立你自己的 GitHub repository，把這個資料夾（`badminton_match/`）的內容放到 repo 根目錄。
2. 到該 repo 的 **Settings → Pages**，「Build and deployment」的 Source 選擇 **GitHub Actions**。
3. Push 到 `main` 分支，等待 Actions 執行完成，網站就會發布在 `https://<你的帳號>.github.io/<repo 名稱>/`。

若不想用 GitHub Actions，也可以本機執行 `npm run build` 後，把 `dist/` 資料夾內容手動部署到任何靜態網站空間（`vite.config.ts` 使用相對路徑 `base: './'`，放在任何子路徑下都能正常運作）。

## 授權

沿用原始專案授權範圍，僅供社群/團練活動免費使用。
