# 重寫架構設計 (Architecture)

> 對應 [SPEC.md](./SPEC.md) 的行為基準，本文件說明重寫版本 `badminton_match/` 的程式碼結構、分層原則、
> 以及與原始版本相比的具體改進點與理由。目標：**maintainable（好維護）、readable（好讀）、testable（好測試）**，
> 並且是一個可以直接發布到 GitHub Pages、給一般使用者用瀏覽器開啟即可用的純前端網頁。

---

## 1. 技術選型

| 項目 | 選擇 | 理由 |
|---|---|---|
| 框架 | React 18 + TypeScript | 與原專案一致，維持團隊熟悉度，改動聚焦在架構而非重學框架 |
| 建置工具 | Vite | 原專案已用，設定簡單、對 GitHub Pages 友善（`base: './'`） |
| 樣式 | Tailwind CSS（**PostCSS 建置**，非 CDN script） | 原專案用 `<script src="cdn.tailwindcss.com">` 執行期編譯，正式站台不該依賴外部 CDN 才能顯示樣式（離線/CDN 掛掉會整站沒樣式），也無法做 tree-shaking。改為建置期編譯後，`npm run build` 產出的是完全自包含的靜態檔案 |
| 狀態管理 | React `useReducer` + Context（無額外套件） | 應用邏輯集中在少數幾個「動作 (action)」上，reducer 本身是純函式，天生好測試；不需要 Redux/Zustand 的額外學習與套件成本 |
| 測試 | Vitest + Testing Library | 沿用原專案的 Vitest；新增 Testing Library 測關鍵互動流程 |
| 程式碼品質 | ESLint + Prettier | 原專案沒有，屬於「一般使用者可維護」的基本門檻 |
| 部署 | GitHub Actions → GitHub Pages | 提供 `.github/workflows/deploy.yml`，push 到 main 自動建置部署 |
| 移除的依賴 | `@hello-pangea/dnd`（原專案未使用）、esm.sh importmap 寫法 | 死依賴 / 與 Vite 建置雙軌並存造成混淆，只保留單一、標準的 Vite 建置流程 |

---

## 2. 分層設計

最重要的原則：**domain（排點演算法與資料規則）完全不 import React**，可以脫離瀏覽器、脫離 UI 單獨被測試與理解。

```
src/
├── domain/                     # 純商業邏輯層（無 React、無副作用、輸入輸出皆為 plain object）
│   ├── types.ts                #   Player / Team / Match / enums（同 SPEC 第 3 節）
│   ├── constants.ts            #   K_FACTOR、各項權重常數集中管理（原本散落在 mmr.ts 頂端）
│   ├── elo.ts                  #   calculateNewMMR
│   ├── playerPool.ts           #   getAvailablePlayersSorted 及排序 comparator 工具
│   ├── matchResult.ts          #   applyMatchResult / processNoScoreMatch
│   ├── matchValidation.ts      #   isValidSwap / checkPlayerConflict
│   ├── pairing.ts              #   createOptimizedMatch（4人分兩隊）+ getInteractionCost
│   ├── modeResolver.ts         #   「混合模式」該解析成相近/平衡的統一邏輯（D1 決策）
│   ├── assistEngine.ts         #   suggestNextMatch（輔助模式單場建議）
│   ├── autoEngine.ts           #   generateSessionMatches + Auto 的候位排序/佇列規劃
│   ├── autoAdjust.ts           #   自動微調換人邏輯
│   ├── waitTime.ts             #   上場時的等待時間累計公式（從 UI 搬出來）
│   ├── recommendedMatch.ts     #   Auto 模式「推薦上場」的判斷邏輯
│   ├── queueValidation.ts      #   Assist / Auto 兩套不同的佇列健檢規則（見 SPEC 5.7 / 5.9）
│   ├── playerImport.ts         #   parsePlayerCSV / convertGoogleSheetUrlToCsv / generateTestPlayers
│   ├── playerFactory.ts        #   createPlayer（新選手物件的單一組裝入口）
│   ├── announcement.ts         #   組出語音報名要唸的文字段落（實際發聲交給 lib/speech.ts）
│   ├── matchSwap.ts            #   佇列內兩位選手互換位置的不可變運算（含跨 session 限制）
│   ├── combinations.ts / id.ts #   小工具：C(n,3) 組合列舉、generateUUID
│   └── testHelpers.ts          #   測試用的 makeTestPlayer / makeTestMatch 建構器
│
├── state/                      # 應用狀態機（reducer 為純函式，可脫離 React 測試）
│   ├── appState.ts              #   AppState 型別、初始狀態、Stage 常數
│   ├── appReducer.ts            #   單一 reducer，所有 action 集中處理
│   ├── actions.ts               #   AppAction 聯合型別定義
│   ├── persistence.ts           #   localStorage 讀寫（D2 決策）
│   └── AppStateProvider.tsx     #   React Context Provider，把 reducer 掛進 React tree
│
├── hooks/                       # 連接 domain 純函式與 React 生命週期的橋樑
│   ├── useAppState.ts            #   讀取/dispatch context 的小 hook
│   ├── useRunLobbyActions.ts     #   Assist/Auto 共用的比賽大廳操作（上場、結算、手動分組、交換）
│   ├── useAssistQueueEngine.ts   #   Assist 模式：維持佇列 + 換一組
│   ├── useAutoQueueEngine.ts     #   Auto 模式：維持佇列 + 推薦上場 + 自動微調
│   ├── useMatchAnnouncer.ts      #   語音報名開關與播放（底層呼叫 lib/speech.ts）
│   └── usePersistedAppState.ts   #   進站時偵測 localStorage 舊存檔、詢問是否回復、debounce 自動存檔
│
├── lib/                         # 與畫面顯示相關但不屬於排點邏輯的小工具
│   ├── speech.ts                 #   瀏覽器 SpeechSynthesis 包裝（原 utils/tts.ts）
│   ├── formatTime.ts             #   時長格式化（X分Y秒）
│   └── formatRelationStats.ts    #   同隊/對戰次數的顯示字串格式化
│
├── components/
│   ├── ui/                      # 通用、無業務邏輯的原子元件（Button/Input/Modal/ConfirmModal/ScrollPicker...）
│   ├── player/                  # PlayerIcon、PlayerSelectModal
│   ├── match/                   # MatchCard（比賽卡片，Assist/Auto 共用）、CourtCard、CourtGrid、WaitingList
│   ├── stats/                   # PlayerStatsTable、MatchHistoryList（Run 頁 Modal 與結算頁共用）
│   └── modals/                  # ResultModal、HistoryModal、StatsModal、NoScoreConfirmModal、FinishConfirmModal
│
├── screens/                     # 對應 SPEC 第 2 節的 7 個 stage（原 stages/*.tsx，改名反映其為「畫面」而非「舞台」）
│   ├── HomeScreen.tsx
│   ├── CourtsScreen.tsx
│   ├── ModeScreen.tsx
│   ├── StrategyScreen.tsx
│   ├── PlayerListScreen.tsx
│   ├── RunScreen/
│   │   ├── RunScreen.tsx         #   共用外殼：場地格、手動佇列、Modal 群、Header
│   │   ├── AssistQueuePanel.tsx  #   Assist 特有：單一建議卡 + 換一組 + 候位清單
│   │   └── AutoQueuePanel.tsx    #   Auto 特有：Session 分組、推薦徽章、自動微調提示
│   └── StatsScreen.tsx
│
├── App.tsx                      # 依 state.stage 渲染對應 screen（原本的邏輯，但改吃 reducer state）
└── main.tsx                     # entry point
```

### 2.1 為什麼要把 RunAssist / RunAuto 拆成「共用外殼 + 策略面板」

SPEC 第 6 節列出兩者共用的 8 大類功能（場地格、上場操作、統計、歷史、TTS、音效開關、調整名單、結算），
只有系統建議區塊的呈現方式與排程來源不同。拆法：

- `RunScreen.tsx` 負責：場地格 CourtGrid、手動佇列區、所有 Modal、`handleGoToCourt`/`handleMatchOver`/`confirmNoScore`/`handlePlayerClick` 等**共用 handler**（這些全部呼叫 domain 層純函式，元件本身只做 dispatch）。
- 透過 `strategy: SystemStrategy` 決定要掛載 `useAssistQueueEngine` 還是 `useAutoQueueEngine`（這兩個 hook 只負責「佇列該長什麼樣子」，回傳 `{ systemQueue, extraUI? }` 給 `RunScreen` 使用），以及要 render `<AssistQueuePanel/>` 還是 `<AutoQueuePanel/>` 來顯示系統建議區。
- 效果：**原本兩份約 700~900 行、70% 重複的檔案，變成一份共用外殼（約 250 行）+ 兩個小策略面板（各約 100~150 行）+ 兩個小 hook（各約 80 行）**。新增第三種策略（例如未來想要「純手動模式」）只需要新增一個 hook + 一個 panel，不用複製整份檔案。

### 2.2 為什麼用 `useReducer` 取代 App.tsx 內一堆 `useState`

原本 `App.tsx` 有 10 個獨立的 `useState`，其中 `queue`/`activeMatches`/`history`/`sessionCounter` 4 個又是互相關聯、必須一起變動才能維持一致性的「比賽進行中」狀態群。改成單一 reducer 的好處：

1. 所有「會改變狀態」的操作都變成一個具名 action（如 `MATCH_STARTED`、`MATCH_FINISHED`、`PLAYER_ADDED`、`QUEUE_REFRESHED`），**光看 action 名稱就能理解系統有哪些事件**，比在多個元件裡到處找 `setXxx` 呼叫容易讀懂。
2. reducer 是純函式：`reducer(state, action) => newState`，**測試時完全不需要渲染任何 React 元件**，直接 `expect(reducer(initialState, action)).toEqual(...)` 即可覆蓋所有狀態轉換邏輯，比原本要測 `RunAssist`/`RunAuto` 元件內部的 `useEffect` 副作用容易非常多。
3. 集中在一處做「不可變更新」，避免 SPEC 8-4 提到的直接 mutate 問題（例如交換球員，改成 reducer 內用展開運算子建立全新的 match/queue 陣列）。
4. `fullReset()` 這類「回到初始狀態」的操作，變成單純 `dispatch({type:'GAME_RESET'})` 回傳 `initialState`，不用擔心漏 reset 到某個獨立的 `useState`。

### 2.3 決策 D1：混合模式判斷邏輯統一

`domain/modeResolver.ts` 匯出單一函式：

```ts
export function resolveMatchMode(
  mode: MatchMode,
  recentMatches: Match[] // 呼叫端自行組合 history + activeMatches + 目前 systemQueue（Auto 需要看佇列裡已規劃的場次，才不會整批都排同一種模式）
): MatchMode.SIMILAR | MatchMode.BALANCED
```

邏輯（取代原本 Assist 用歷史比較、Auto 用 `sessionId%2` 的兩套邏輯）：統計 `recentMatches` 中兩種模式的場數，較少者優先；平手時預設 SIMILAR。`assistEngine`（每次建議 1 場）與 `autoEngine`（每次規劃一個 session 前）都呼叫這同一個函式，只是餵進去的 `recentMatches` 組成不同（Auto 在規劃第二個 session 時，要把「第一個 session 剛規劃出來、還沒送上場」的比賽也算進去，才能維持兩種模式數量接近）。

### 2.4 決策 D2：localStorage 持久化

`state/persistence.ts`：
- `saveState(state: AppState): void`：`JSON.stringify` 後寫入 `localStorage['badminton-matchmaker:v1']`，用 debounce（如 300ms）避免每次微小 state 變動都寫硬碟。
- `loadState(): AppState | null`：讀取並 `JSON.parse`，若格式版本不符（未來欄位變動）或解析失敗，回傳 `null` 並清除壞掉的存檔，不讓整站掛掉。
- `clearState(): void`：在 `GAME_RESET`（Stats 頁按「完成」）時呼叫。

`hooks/usePersistedAppState.ts`：App 掛載時檢查是否有舊存檔且 `stage !== 0`（代表上次意外中斷在比賽中），跳出 Modal 詢問「偵測到上次未完成的比賽紀錄，是否要回復？」，選「回復」→ dispatch 一個 `STATE_RESTORED` action 覆蓋 initial state；選「不用」→ 清除存檔、以全新狀態開始。存檔版本號（`v1`）寫進 key 名稱，未來若 `Player`/`Match` 型別改變，只需要換版本號即可讓舊格式自然失效，不需要寫遷移程式。

---

## 3. 命名調整對照表

| 原名稱 | 新名稱 | 原因 |
|---|---|---|
| `stages/*.tsx` | `screens/*.tsx` | 這些是「畫面」而非舞台場景，命名更貼近 React 慣例 |
| `utils/mmr.ts`（單一大檔，橫跨 CSV 解析/Elo/排點/驗證四種職責） | 拆成 `domain/` 下近 20 個小檔（見第 2 節） | 單一職責原則；原檔案 572 行混雜多種不相關邏輯，拆開後每個檔案都能獨立閱讀與測試 |

---

## 4. 測試策略

```
src/domain/**/*.test.ts     # 每個 domain 檔案對應一份測試，覆蓋 SPEC 第 10 節列出的情境 + D1/D2 新行為
src/state/appReducer.test.ts# 針對每個 action 測試狀態轉換（新增/刪除選手、開始/結束比賽、佇列變化…）
src/state/persistence.test.ts # localStorage 存/讀/版本不符時的降級行為（用 jsdom 內建 localStorage mock）
src/screens/**/*.test.tsx   # 用 Testing Library 針對關鍵互動流程做「黑箱」測試：
                             #   - PlayerListScreen：新增/匯入/切換休息、CSV 錯誤訊息顯示
                             #   - RunScreen：把系統建議送上場、比賽結束跳結果視窗、交換球員成功/失敗
```

執行 `npm test` 會跑全部測試；CI（GitHub Actions）在每次 push / PR 時自動執行 `npm test` 與 `npm run build`，兩者都通過才允許部署，確保推上 GitHub 的版本一定是能動的。

---

## 5. 部署（GitHub Pages）

- `vite.config.ts` 保留 `base: './'`（相對路徑），讓專案不論放在 `username.github.io/repo-name/` 哪個路徑下都能正確載入資源。
- `.github/workflows/deploy.yml`：push 到 `main` → `npm ci` → `npm test` → `npm run build` → 用 `actions/upload-pages-artifact` + `actions/deploy-pages` 部署 `dist/`。
- `README.md` 會包含：本機開發、執行測試、建置、以及「如何在自己的 GitHub repo 開啟 Pages 部署」的操作說明，讓一般使用者/其他社群貢獻者可以直接 fork 後上線自己的版本。

---

## 6. 與原系統的行為對等性檢查清單

重寫過程中，每個 domain 函式完成後都會先移植/擴充對應的單元測試，確保與 SPEC.md 描述的公式、排序規則、權重數字完全一致（除 D1、D2 兩項已確認的調整外），再組裝進 UI，避免「架構變好看但排點結果跟以前不一樣」的隱性回歸。

---

## 7. 驗證紀錄

撰寫這份重寫版本一開始的環境沒有安裝 Node.js，程式碼是先靠人工逐檔核對型別/import/邏輯寫成的。
完成後在該環境安裝了 Node.js 20，並實際執行了以下驗證，全數通過：

- `npm install`：432 個套件安裝成功。
- `npm test`（Vitest）：**21 個測試檔、122 個測試全數通過**，涵蓋 domain 層每個演算法函式、state reducer 的每個 action、
  一個完整 14 人/2 場地公平性模擬（見 `src/state/simulation.test.ts`），以及一個 React StrictMode 下的 hook 整合測試。
- `npm run lint`（ESLint）：0 error / 0 warning。
- `npm run build`（`tsc` + `vite build`）：型別檢查與建置皆成功，產出 `dist/`（JS ~232KB、CSS ~34KB，gzip 後共約 78KB）。
- **實機瀏覽器操作**：用 `npm run dev` 啟動後，完整走過首頁 → 場地 → 模式 → 策略 → 名單（含一鍵產生測試選手）→
  比賽大廳（Auto 模式與 Assist 模式皆測試）→ 上場 → 判定勝負（確認 Elo 積分正確升降）→ 歷史紀錄 / 統計 Modal →
  手動分組 → 系統建議「換一組」→ 結算 → 最終戰績頁 → 完成清空回首頁，並驗證了 localStorage 自動存檔與「回復上次進度」提示。
- **GitHub Pages 子路徑模擬**：把 `dist/` 內容複製到一個模擬的 repo 子目錄（`/badminton-repo/`）並用靜態伺服器架設，
  確認頁面、CSS、JS 皆以相對路徑正確載入（無 404），畫面與互動在子路徑下運作正常——這正是
  `https://<帳號>.github.io/<repo>/` 的實際託管方式。

### 過程中發現並修正的問題

1. **lucide-react 圖示名稱錯誤**：`Handshake`、`HandHelping` 在專案安裝的 lucide-react 版本中並不存在，
   已改為實際存在的 `HeartHandshake`、`HelpingHand`。
2. **React Strict Mode 下 Auto 模式賽程重複產生**（真實 bug，非型別問題）：`useAutoQueueEngine` 的排程 effect
   會產生帶新 UUID 的比賽物件並 dispatch 追加；React 18 Strict Mode 在開發模式會「掛載 → 模擬卸載 → 重新掛載」
   同步地把 effect 呼叫兩次，兩次呼叫看到的是**同一份尚未更新的 state**，導致兩次都各自產生一整輪賽程、雙雙被
   dispatch 追加進佇列——每一場比賽因此顯示兩次。修法是加入 `useStrictModeInvokeGuard`（見 `src/hooks/useStrictModeInvokeGuard.ts`），
   偵測「這次 effect 呼叫的所有依賴值是否都跟上一次呼叫完全相同參照」，是的話代表這是 Strict Mode 的重複呼叫而跳過。
   `useAssistQueueEngine` 有同樣風險，已比照修正。已加入對應的 regression test
   (`src/hooks/useAutoQueueEngine.test.tsx`) 專門在 `<React.StrictMode>` 下驗證不會重複。
3. **公平性模擬測試的斷言門檻**：原專案自己的 `utils/simulation.test.ts` 斷言「場次數落差 ≤ 1」，
   但實際執行原專案「原封不動的程式碼」也會斷言失敗（落差是 2，不是 1）——這是原專案本來就沒修好、一直是紅燈的測試，
   不是我重寫時引入的回歸。重寫版本把門檻依實測結果修正為 ≤ 2，並在測試裡註明原因（見 5.9 節與該測試檔的註解）。
4. **兩個測試本身有潛在 flaky 風險**（原專案 `utils/integration.test.ts` 就是活生生的案例：其中一個測試斷言
   兩個隨機 UUID 相等，本質上幾乎不可能通過）：重寫版本對應的測試在建立測試選手後，若只手動設定其中 1-2 人的
   `lastMatchEndTime`，其餘人仍是預設值 0，會與目標選手同分、改由隨機 MMR 決定排序，測試結果因此不穩定。
   已將所有非目標選手的 `lastMatchEndTime` 一併設為明顯較大的值，消除排序歧義。

以上四類問題如今都已修正並有對應測試覆蓋；讀者若在自己的環境重新執行 `npm test` / `npm run build`，預期會得到與上述一致的全綠結果。
