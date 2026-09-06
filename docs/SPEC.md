# 羽球排點系統 — 功能規格書 (Spec)

> 本文件由審閱原始專案 `badminton/`（App.tsx、stages/*、components/*、utils/mmr.ts、utils/tts.ts 及所有測試檔）後整理而成，
> 目的是完整記錄「操作流程」與「排點演算法邏輯」，作為重寫版本 (`badminton_match/`) 的行為基準（behavioral baseline）。
> 除文件末尾「決策紀錄」中列出的兩項已與使用者確認的行為調整外，重寫版本的邏輯應與本規格描述的原系統一致。

---

## 1. 專案定位

一個給羽球團練 / 揪團活動使用的「排點（配對上場）小工具」，單機網頁應用（無後端、無登入），流程為：

設定場地 → 選擇配對模式 → 選擇系統輔助策略 → 建立選手名單 → 進行比賽（系統建議配對 + 手動調整）→ 結束後看總結戰績。

核心價值：
- 依 **ELO 風格積分 (MMR)** 自動配對，讓對戰盡量勢均力敵（或依模式故意拉開）。
- 依 **候位順序（等待時間 / 已打場次）** 保證公平輪替，避免有人一直沒球打。
- 盡量避免同一批人一直重複組隊 / 對戰（partner / opponent 歷史懲罰）。
- 支援「系統全自動建議」與「人工手動排點」並存，使用者可隨時介入調整。

---

## 2. 使用者流程 (Stage Flow)

App 是一個以 `stage: number` 驅動的精靈式（wizard）單頁流程，狀態全部提升到最上層 `App.tsx` 用 `useState` 管理，逐層以 props 往下傳。

| Stage | 元件 | 標題 | 說明 |
|---|---|---|---|
| 0 | `Home` | 首頁 | 品牌頁，一個「打球啦」按鈕進入流程 |
| 1 | `Courts` | Step 1：設定場地數量 | 用 `ScrollPicker` 選擇場地數（1–50，預設 2） |
| 2 | `Mode` | Step 2-1：選擇對戰模式 | 三選一：A 相近 / B 平衡 / C 混合 |
| 3 | `Strategy` | Step 2-2：選擇系統策略 | 二選一：輔助模式(Assist) / 自動模式(Auto) |
| 4 | `PlayerList` | Step 3：選手名單 | 新增/匯入/移除選手、標記上場或休息，最少需 4 位「上場中」選手才能繼續 |
| 5 | `RunAssist` 或 `RunAuto` | 比賽大廳 | 依 Stage 3 選的策略決定用哪個元件；比賽進行的主畫面 |
| 6 | `Stats` | 最終戰績結算 | 顯示排名、個人統計、完整歷史紀錄，「完成」會清空全部資料回到首頁 |

**返回名單頁的特殊規則**：從 Stage 5 按「調整名單」會回到 Stage 4（PlayerList），此時 `hasGameStarted=true`：
- 「回上一步」按鈕會被 disable（比賽開始後不能再改場地數/模式/策略）。
- 「下一步」按鈕文字變成「完成編輯 (回大廳)」。

**結束比賽**：Stage 5 內按「結算」→ 二次確認 Modal → 進入 Stage 6。Stage 6 按「完成」會呼叫 `fullReset()`，清空所有 state（players、queue、activeMatches、history、sessionCounter、courtCount 回 2、mode 回 MIXED、strategy 回 ASSIST）並回到 Stage 0。

---

## 3. 資料模型 (Domain Model)

```ts
enum Gender { MALE = '男', FEMALE = '女' }

interface Player {
  id: string;
  name: string;
  gender: Gender;
  mmr: number;              // 目前積分（會隨比賽結果變動）
  initialMmr: number;       // 入場時的積分快照，用來算「總結時漲跌」
  matchesPlayed: number;
  wins: number;
  losses: number;
  totalPoints: number;      // 歷來「己隊比分」加總（不是勝負，是原始 s1/s2 加總）
  totalMinutes: number;     // 歷來已上場比賽時長加總（分鐘）
  totalWaitTime: number;    // 歷來候位等待時間加總（毫秒）
  maxWaitTime: number;      // 單次等待最長紀錄（毫秒）
  lastMatchEndTime: number; // 上次比賽「被標記結束」的時間戳；0 = 從未上場過
  partners: Record<string, number>;  // 對方 playerId -> 同隊次數
  opponents: Record<string, number>; // 對方 playerId -> 對戰次數
  isActive: boolean;        // false = 設為「休息中」，完全不參與排點
}

enum MatchMode { SIMILAR = 'A', BALANCED = 'B', MIXED = 'C' }
enum SystemStrategy { ASSIST = 'ASSIST', AUTO = 'AUTO' }
enum MatchStatus { QUEUED = 'QUEUED', PLAYING = 'PLAYING', FINISHED = 'FINISHED' }

interface Team { players: Player[]; score?: number; }

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  status: MatchStatus;
  courtId?: number;
  modeLabel: string;   // UI 顯示用文字，如 "A. 相近" / "B. 平衡 (Auto)" / "Manual"
  mode: MatchMode;     // 這場比賽實際套用的模式（Mixed 會被解析成 SIMILAR 或 BALANCED）
  sessionId: number;   // 批次/輪次編號
  startTime?: number;
  endTime?: number;
  isManual?: boolean;  // true = 使用者手動建立，false/undefined = 系統建議
}
```

**注意**：`lastMatchEndTime` 只會在比賽被「結算」的那一刻寫入（`applyMatchResult` 記分結算，或 `processNoScoreMatch` 不計分結算，兩者都寫入 `Date.now()`），代表「這位選手上一場比賽被標記結束的時間」；「送上場（Go To Court）」的當下只會**讀取**這個欄位來計算等待時間（見 5.4），並不會寫入它。命名與實際語意一致，重寫時沿用同名欄位即可。

---

## 4. 選手名單頁（PlayerList）功能

1. **手動新增**：姓名（必填）、性別（單選，預設男）、積分（預設 1200，範圍 0–5000，超出範圍或非數字會跳警告 Modal）。
2. **批量匯入**，三種來源，共用同一個 CSV 解析器 `parsePlayerCSV`：
   - **文字貼上**：一行一位，格式 `姓名, 性別(選填), 積分(選填)`，逗號支援全形「，」。
   - **上傳 .csv 檔案**：用 `FileReader.readAsText` 讀檔案內容後同樣丟給解析器。
   - **Google 試算表連結**：從 URL 用正則抓出 `/d/{id}/`，可選 `gid`，轉成
     `https://docs.google.com/spreadsheets/d/{id}/export?format=csv&gid={gid}`（預設 gid=0），
     `fetch` 該連結取得純文字 CSV 後丟給同一個解析器。抓取失敗（權限未開放連結分享、網路錯誤）要顯示對應錯誤訊息。
   - **CSV 解析規則**：
     - 以 `\r?\n` 分行，去除空行。
     - 每行以 `,` 或 `，` 切欄位，`trim()`。
     - 第一欄是姓名；空字串 → 記一條錯誤，該行整行跳過（不產生 player）。
     - 第二欄（性別，選填）：字串小寫後若包含 `女` / `f` / `woman` / `girl` → 女；其餘一律視為男（預設男）。
     - 第三欄（積分，選填）：`parseInt` 失敗 → 記一條「格式錯誤，使用預設值 1200」的錯誤，但**該位選手仍會被建立**（積分為 1200），不算整行失敗。
     - 回傳 `{ players: Player[], errors: string[] }`；只要 `errors.length>0` 就在匯入區顯示錯誤清單，但只要有解析出至少一位選手就會真的加進名單（部分成功）。
     - 全部解析成功（無錯誤）才會自動關閉匯入面板並清空輸入框；有錯誤時保留面板讓使用者看錯誤訊息。
3. **產生測試選手**：用 `ScrollPicker` 選數量（預設 = 場地數 × 7，範圍 4 ~ max(100, 場地數×10)），一鍵產生指定數量的隨機測試選手：
   - 名稱 `P{目前總人數+1}`, `P{+2}`, …
   - 積分 `1000 + random(0~799)` 均勻分布。
   - 性別 60% 男 / 40% 女（`Math.random() > 0.4 ? 男 : 女`）。
4. **選手列表操作**：
   - 「上場中 / 休息中」開關（`isActive` 切換）：休息中的人完全不進入排點運算，也不會出現在候位清單。
   - 刪除選手（垃圾桶圖示，無需確認）。
   - 表頭統計：總人數 / 上場人數 / 休息人數。
5. **進入比賽的最低限制**：`isActive` 的人數必須 ≥ 4，否則「下一步」按鈕 disabled。

---

## 5. 核心排點演算法

排點的核心檔案是 `utils/mmr.ts`，所有邏輯都是**純函式**（不依賴 React），這是原本設計中做得最好的部分，重寫時應繼續保持「domain 邏輯 100% 與 UI 解耦」。

### 5.1 候位排序 `getAvailablePlayersSorted(allPlayers, activeMatches, queuedMatches)`

這是所有配對演算法的共同輸入來源：

1. **排除忙碌者**：所有出現在 `activeMatches`（正在場上）或 `queuedMatches`（不管手動還系統，只要已經在佇列中）裡的 playerId，一律視為「忙碌」。
2. **過濾**：只留下 `isActive === true` 且不忙碌的人。
3. **排序（優先序，數字小的排前面 = 優先上場）**：
   1. `lastMatchEndTime` 升冪（0 = 從未上場過 = 視為等最久，排最前面）。
   2. 平手時比 `matchesPlayed` 升冪（打越少場的人優先）。
   3. 再平手時比 `mmr` 降冪（積分高的排前面——影響很小，主要是讓排序穩定）。

排出來的陣列本文稱為 **候位清單 (waiting list)**，索引 0 是「最該上場的人」。

### 5.2 ELO 積分計算 `calculateNewMMR(team1, team2, score1, score2)`

標準 Elo 邏輯，以「隊伍平均分」當作雙方戰力：

```
avg1 = team1 平均 mmr
avg2 = team2 平均 mmr
expected1 = 1 / (1 + 10^((avg2 - avg1) / 400))
actual1   = score1>score2 ? 1 : score1===score2 ? 0.5 : 0
delta1    = K(=32) * (actual1 - expected1)
delta2    = -delta1
team1 每個人的新 mmr = round(原 mmr + delta1)
team2 每個人的新 mmr = round(原 mmr + delta2)
```

- **K-factor 固定 32**，不分段（沒有新手/資深的差異化 K 值）。
- 隊伍內每個人拿到「相同的」delta（不會因為個人 mmr 不同而有不同增減）。
- 只需要「贏/輸/平」的相對關係，`score1`/`score2` 的實際數字大小不影響 Elo delta（只用來判斷輸贏平），但原始分數會被記進 `totalPoints`。

### 5.3 比賽結果套用 `applyMatchResult` / `processNoScoreMatch`

**正常結算 `applyMatchResult(allPlayers, match, s1, s2, durationMinutes)`**：
1. 用 match 裡球員的 id 到 `allPlayers` 找出「最新」的球員資料（避免用到 match 快照裡的舊資料）。
2. 呼叫 `calculateNewMMR` 算新積分。
3. 對每個參賽者：
   - `mmr` 更新。
   - `matchesPlayed += 1`。
   - `wins`/`losses` 依照「自己隊伍分數 vs 對方隊伍分數」各 +1（平手兩邊都不加）。
   - `totalPoints += 自己隊伍的分數`。
   - `partners[隊友id] += 1`（對每個隊友各加一次計數）。
   - `opponents[對方id] += 1`（對每個對方球員各加一次）。
   - `totalMinutes += durationMinutes`。
   - `lastMatchEndTime = Date.now()`（結算當下的時間戳，供下一次上場時計算等待時間用，見 5.4）。
4. 回傳 `changes: {playerId, name, oldMMR, newMMR}[]`，供 UI 顯示「積分升降」彈窗。

**不計分結算 `processNoScoreMatch(allPlayers, match, durationMinutes)`**：
- 只更新 `matchesPlayed`、`partners`、`opponents`、`totalMinutes`、`lastMatchEndTime`。
- **完全不動 `mmr`、`wins`、`losses`、`totalPoints`**。
- 用於「這場其實沒好好打/忘記計分/友誼賽」的情境。

### 5.4 上場時的等待時間累計（在 `handleGoToCourt`，非 mmr.ts）

⚠️ 這段邏輯目前寫在 UI 元件（RunAssist/RunAuto）裡，屬於業務邏輯外洩到元件層，重寫時應搬進 domain 層。

當一場 Match 從「佇列」被送上場（不管是手動分組還是系統建議）：
```
now = Date.now()
對這場比賽的 4 位球員：
  startWait = p.lastMatchEndTime > 0 ? p.lastMatchEndTime : sessionStartTime
  addedWait = now - startWait
  p.totalWaitTime += addedWait
  p.maxWaitTime = max(p.maxWaitTime, addedWait)
```
- `sessionStartTime` 是進入 Run 頁面那一刻的時間戳（`useState(Date.now())` 只設定一次）。
- `lastMatchEndTime` 是「上一場比賽被標記結束」的時間戳，因此 `addedWait` 語意就是「從上一場打完，到這次被送上場為止，中間候位等待的時間」——是精確的候位等待時間，不含上一場的比賽時長。首次上場（`lastMatchEndTime===0`）則以 `sessionStartTime`（進入 Run 頁面的時間）當起點。
- 送上場後才把 match 從 `queue` 移除、加進 `activeMatches`，並用 `refreshPlayers` 把 match 內 player 快照換成 `updatedPlayersList` 裡的最新版本（避免顯示舊積分/舊統計）。
- 若目标场地已经被占用 (`checkPlayerConflict` 侦测到冲突) 会跳错误 Modal，不会真的上场。

### 5.5 配對評分共用邏輯

**互動懲罰 `getInteractionCost(players)`**（4 人一組，兩兩配對算成本）：
```
cost = Σ over all pairs (i,j):
   partnersCount(i,j) * 500   // WEIGHT_PARTNER_HISTORY
 + opponentsCount(i,j) * 100  // WEIGHT_OPPONENT_HISTORY
```
分數越低越好；同隊過的人（partner）懲罰是對戰過的人（opponent）的 5 倍，代表系統認為「重複組隊」比「重複對戰」更該避免。

**四人分隊 `createOptimizedMatch(chunk4, modeLabel, mode, sessionId, isManual)`**：
給定任意 4 人，窮舉 3 種分隊方式（C(4,2)/2 = 3 種）：
```
{0,1} vs {2,3}
{0,2} vs {1,3}
{0,3} vs {1,2}
```
對每種分法算 `scorePairing`：
```
balancePenalty = |隊1平均mmr - 隊2平均mmr|
p1History = 隊1兩人是否曾同隊過的次數
p2History = 隊2兩人是否曾同隊過的次數
oppHistory = 隊1隊2兩兩對戰過的總次數
score = balancePenalty*2 + (p1History+p2History)*500 + oppHistory*50
```
取 `score` 最小的分法。**這一步永遠會讓兩隊實力盡量接近**（不管外層是「相近」還是「平衡」模式，因為 4 人已經被外層邏輯選出來了，這裡只是「這 4 人裡面怎麼分隊最公平」）。

### 5.6 輔助模式：單場建議 `suggestNextMatch`（Assist 用）

輸入：`availablePlayers`（已排序候位清單）、`mode`、`history`、`activeMatches`、`sessionId`、可選 `blacklistIds`（用於「換一組」時排除某些人）。

1. 若候位 < 4 人 → 回傳 `null`。
2. **錨點 (Anchor)**：候位清單第 0 位，**一定會被排進這場比賽**（保證等最久的人優先被安排）。
3. **候選池**：候位清單第 1 位以後的人；若有 `blacklistIds` 則先排除掉這些人。
4. 候選池 < 3 人 → 回傳 `null`（湊不出 4 人）。
5. 只取候選池的**前 12 位**（`searchPool`，效能考量，避免組合爆炸；候位越後面的人本來也不該被優先湊進來）。
6. **決定這場實際要用「相近」還是「平衡」**（只有外層 mode 是 MIXED 時才需要決定）：
   - 統計 `history` + `activeMatches` 中 `mode === SIMILAR` 的場數 (`simCount`) 與 `mode === BALANCED` 的場數 (`balCount`)。
   - `simCount <= balCount` → 用相近，否則用平衡。（即「歷史上場次較少的模式，這次優先補」）
7. 對 `searchPool` 取所有 C(n,3) 組合（n ≤ 12，最多 C(12,3)=220 組），每組跟錨點拼成 4 人，計算 `cost`：
   ```
   cost = getInteractionCost(4人)
        + mmrSpread(4人的mmr全距) * (相近模式權重1 或 平衡模式權重0.25)
        + Σ(candidate 在候位清單中的 index) * 75   // WEIGHT_WAIT_ORDER，越後面的人成本越高
   ```
   取 `cost` 最小的 4 人組合。
8. 用 5.5 的 `createOptimizedMatch` 把這 4 人分成兩隊，回傳 `Match`（`isManual=false`）。

**設計含意**：相近模式權重是平衡模式的 4 倍（1 vs 0.25），所以「相近模式」對 mmr 全距特別敏感（會盡量找積分相近的 4 人），「平衡模式」對 mmr 全距較不敏感（可以接受積分差較大的 4 人，因為反正 `createOptimizedMatch` 那一步會負責把強弱分到不同隊）。

### 5.7 輔助模式在畫面上如何維持佇列（Assist 專屬的 orchestration，在 `RunAssist.tsx` 的 `useEffect`）

「輔助模式」的核心精神是「系統只維持恰好 1 個建議，其餘全部靠使用者手動排點」：

1. 每當 `players` / `activeMatches` / `queue` / `manualQueue.length` / `history` / `mode` 變動時觸發。
2. 先做**佇列健檢**：系統建議（非 manual）中，若有任何一場的球員已經在 `activeMatches` 或 `manualQueue` 出現，或已被設為休息（`isActive=false`），整場作廢，從 queue 移除。
3. 健檢後若「系統建議的場次數」< 1（`SYSTEM_SUGGESTION_LIMIT`）且候位 ≥ 4，就呼叫一次 `suggestNextMatch` 補一場進 queue，並把 `sessionCounter` +1。
4. 「換一組」按鈕（`handleSystemRefresh`）：找出該場 4 人中 `lastMatchEndTime` 最小（等最久）的當錨點，其餘 3 人丟進 `blacklistIds`，重新呼叫 `suggestNextMatch`（`sessionId` 沿用原本那場的），取代原本那場建議。若候位不足會提示「無法刷新」。

### 5.8 自動模式：整批產生 `generateSessionMatches`（Auto 用）

輸入：`availablePlayers`（已依某種排序排好的候位清單）、`mode`（呼叫前**必須已經**被解析成 SIMILAR 或 BALANCED，這個函式本身不處理 MIXED）、`sessionId`。

1. 候位 < 4 → 回傳 `[]`。
2. 取 `floor(候位人數/4)*4` 人（多出來湊不滿 4 人的尾數，留給下一個 session）。
3. **SIMILAR 模式**：把這批人依 `mmr` 降冪排序，每 4 人一組依序切（最強的 4 人一組、次強 4 人一組...）。
4. **BALANCED 模式**：依 `mmr` 降冪排序後用「對折 (fold)」分組：
   ```
   第 i 組（0-based）= [第 i*2 強, 第 i*2+1 強, 倒數第 i*2 弱, 倒數第 i*2+1 弱]
   ```
   即最強兩人分別配最弱兩人，次強兩人配次弱兩人，以此類推，讓每組「組內」強弱懸殊但「組間」總體戰力接近。
5. 每組 4 人都丟進 `createOptimizedMatch`（5.5）決定怎麼分隊。

### 5.9 自動模式的批次產生排程（`RunAuto.tsx` 的 `useEffect`，"LOGIC 3"）

「自動模式」的核心精神是「系統一次規劃好幾輪（session），使用者主要負責把佇列裡的比賽送上場，很少手動排點」：

1. 觸發條件：`isActive` 的總人數 ≥ 4。
2. 檢查目前系統佇列（非 manual）裡有幾個「不同的 sessionId」。若 ≥ 2，代表已經有足夠的存貨，不做事。
3. 若 < 2，計算還缺幾個 session（`2 - 現有數`），下一個 sessionId 從 `max(現有session)+1` 或 `sessionCounter` 接續（取較大者）。
4. **候位排序（Auto 專用，跟 5.1 不同！）**——這裡「候位」定義為「所有 `isActive` 的人」（不排除已在系統佇列中的人，因為本來就是要幫還沒被排進未來 session 的人優先安排；但這造成同一人可能被排進多個未來 session，靠下面的「佇列出現次數」懲罰去做輪替公平）：
   ```
   排序優先序：
   1. queueCounts[player] 升冪（目前已經被排進多少個未來 session，越少的越優先）
   2. lastMatchEndTime 升冪
   3. matchesPlayed 升冪
   4. mmr 降冪
   ```
5. 對每個要新增的 session：
   - 若外層 mode 是 MIXED，這次 session 用哪個子模式是**單純依 `sessionId % 2`**：偶數 session 用 SIMILAR，奇數用 BALANCED（跟 5.6 的「比較歷史場次」邏輯不同——見文末決策紀錄，重寫版已統一改為場次計數邏輯）。
   - 呼叫 `generateSessionMatches` 產生這個 session 的所有場次。
   - 把這些場次涉及到的球員的 `queueCounts` 都 +1，並重新排序剩餘候位（讓同一批產生迴圈裡，下一個 session 會優先照顧這次沒被排到的人），再產生下一個 session。
6. 一次全部塞進 `queue`，`sessionCounter` 往前推進對應數量。

**另一個跟 Assist 不同的重要行為**：Auto 模式完全沒有「每次比賽結束才補一場」這種節奏，而是「維持庫存恆為 2 個 session」，使用者看到的佇列是「一批一批」出現，並且用 Session 分組顯示。

### 5.10 自動模式的「推薦上場」`recommendedMatchId`（`useMemo`）

僅 Auto 模式有這個 UI 概念（Assist 沒有——Assist 靠「候位清單只有一種排序」加上「永遠只有一則建議」自然達到同等效果）：

1. 若場地已滿（`activeMatches.length >= courtCount`）→ 不推薦任何比賽（免得使用者誤點一個實際上没地方放的比賽）。
2. 若手動佇列（`manualQueue`）裡有任何一場「4 個人都沒有正在場上」→ 推薦第一個符合的手動場次（手動佇列優先權高於系統佇列）。
3. 否則在系統佇列（已依 sessionId 升冪、佇列順序排列）裡找第一個「4 個人都沒有正在場上」的場次來推薦。
4. UI 上被推薦的卡片會有「推薦上場」徽章跟醒目的綠色外框/按鈕。

### 5.11 自動模式的「系統自動微調」`handleAutoAdjust`

當畫面偵測到「目前有空場地，但佇列最前面（`systemQueue[0]`）那場的球員全部/部分正在場上打」時，會顯示一個黃色提示框跟「系統自動微調」按鈕：

1. 目標永遠是 `systemQueue[0]`（佇列第一場，最該優先解決的一場）。
2. 找出這場裡「正在場上打」的球員（`busyInTarget`）。
3. 候選救援名單：`isActive` 且目前沒在場上、且不在目標賽事裡的所有人，依「等最久 → 打最少場」排序。
4. 對 `busyInTarget` 中的每一位，依序找一個候選人來換：
   - 候選人不能已經被這輪用掉。
   - **碰撞檢查**：如果這個候選人目前正待在佇列裡的另一場比賽（`sourceMatch`）裡，而那場比賽裡剛好已經有這位 `busyId`（要被換出去的人）→ 不能選這個候選人（換了會造成 `sourceMatch` 出現重複球員）。
   - 找到就執行雙向交換：目標賽事裡 `busyId → candidate`；candidate 原本所在的那場（如果有）`candidate → busyId`。
5. 若一個都換不成 → 提示「無法微調」。否則提示「已替換 N 名場上選手」。

**這是唯一會把「正在場上比賽的人」的球員物件同時放進佇列裡另一場（透過交換）的邏輯**——但因為 `busyId` 換進去的那場本身也還在 QUEUED 狀態（要等這個人真正打完才能上場），所以不會造成真正的「一人分身兩地」衝突，`handleGoToCourt` 送場前也還會再做一次 `checkPlayerConflict` 保底檢查。

### 5.12 手動排點

1. **手動分組（`PlayerSelectModal`）**：使用者從所有 `isActive` 球員中任選 4 位（不限制對方是否已在場上/佇列中——UI 只是用顏色標示「場上／已排／建議」方便辨識，並不阻擋選取），確認後：
   - 前 2 位固定當隊1，後 2 位固定當隊2（**不會**像 `createOptimizedMatch` 一樣自動找最佳分隊——手動分組完全尊重使用者選擇的順序）。
   - 新場次塞進 `queue` 最前面（`[newMatch, ...prev]`），標記 `isManual: true`、`modeLabel: 'Manual'`、`mode: MIXED`。
2. **手動佇列永遠優先於系統佇列**上場（Auto 模式 `recommendedMatchId` 邏輯，Assist 模式則是 UI 分區排在系統建議之上、且 `handleGoToCourt` 對兩種佇列一視同仁，使用者自行選擇要點哪個上場）。
3. **刪除手動分組**：直接從 queue 移除，無需確認。
4. **拖曳／點選交換球員**（`handlePlayerClick` + `isValidSwap`）：
   - 點一位球員 → 記錄為「選取中」（`selection` state）。
   - 再點另一位（可以是同一場或不同場、手動或系統佇列）→ 嘗試交換兩人位置。
   - `isValidSwap` 檢查：兩場比賽（若不同場）彼此的「另外 3 人」中，不能已經包含對方要換過來的那個人（避免同一場出現重複球員）。
   - **Auto 模式額外限制**：不允許跨 `sessionId` 交換（避免打亂「一個 session 內部湊出的公平輪替」設計），會跳警告；Assist 模式沒有這個限制（因為 Assist 只有一個 sessionId 概念鬆散地存在）。
   - 交換失敗（違反上述規則）→ 顯示錯誤 Modal，並清空選取狀態。
5. **從場上「重排」回佇列**（`handleReturnToQueue`）：把一場 `PLAYING` 的比賽整組退回佇列最前面，並強制標記為 `isManual: true`（即使它原本是系統建議的）——因為球員在場上待的時間已經被 UI 認定成「這組合已經是使用者要保留的決定」，重排回去後不希望系統又把他們拆散。同時清空 `courtId`/`startTime`/`endTime`。

---

## 6. 比賽大廳（Run 頁面）通用功能

以下功能 **Assist 和 Auto 完全共用同一套 UI 與邏輯**（原始程式碼是複製貼上兩份幾乎相同的程式，這是重寫時要優先解決的重複）：

1. **場地格狀顯示**：每個場地一張卡片，顯示「場地N」+ 該場 sessionId；沒有比賽時顯示「等待安排...」。
2. **場上操作**：
   - 「勝」（隊1／隊2 各一顆按鈕）→ 呼叫 `applyMatchResult`，彈出「比賽結束」Modal 顯示每人積分升降。
   - 「平手」→ `s1=s2=0.5` 概念上是平手（實際上程式碼傳的是 `handleMatchOver(match,'draw')` → `s1=0,s2=0`，且 `calculateNewMMR` 內部用 `score1===score2` 判斷平手 actualScore=0.5——換句話說「平手」不是比真正的比分，是三選一的比賽結果列舉）。
   - 「重排」→ 見 5.12-5。
   - 「不計分」→ 二次確認 Modal，說明「只會增加場次，不會動積分/勝敗/得分」，確認後呼叫 `processNoScoreMatch`。
3. **統計 Modal（`showStats`）**：全部球員（不只上場中）依 mmr 降冪列表，欄位：姓名/積分/狀態(上場中或休息)/場次/總時數/總等待/最長等待/勝負/勝率/同隊次數明細/對戰次數明細。
4. **歷史紀錄 Modal（`showHistory`）**：`history` 反序（最新在最上面）列出每場：Session 編號、模式標籤、雙方球員、比分（若無比分顯示「無紀錄」）、比賽時長（`endTime-startTime`）。
5. **語音報名（TTS）**：送球員上場時，若音效開關 `isSoundEnabled` 為開：組出「請 [隊1隊2四人姓名，中間用逗號/與串接] 上場」這句話，**唸兩遍**（`[...seg, ...seg]`），透過瀏覽器原生 `SpeechSynthesis`：
   - 依文字是否含中日韓字元（正則 `[一-龥　-〿＀-￯]`）決定找中文語音（zh-TW 優先）還是英文語音（en-US 優先），找不到就退回系統預設語音。
   - 元件卸載時 `cancelSpeech()`（`window.speechSynthesis.cancel()`）避免殘留語音佇列。
6. **音效開關按鈕**：純粹是否唸報名，不影響任何排點邏輯。
7. **「調整名單」按鈕**：回 Stage 4（`onBack`），比賽資料（queue/activeMatches/history/sessionCounter）全部保留，回來後可以繼續。
8. **「結算」按鈕**：二次確認 Modal → `onFinish` 進 Stage 6。**不會自動把還在場上的比賽結掉**——只是停止畫面繼續產生新建議，若使用者結算時還有人在場上/佇列中，這些未完成的資料就單純不會被計入最終戰績（因為 `Stats` 頁只讀 `players` 現有 state 和 `history`，未完成的場次沒有進 `history`）。這是原系統的既有行為，重寫時應保留，但可以在確認 Modal 文案上更明確提醒「場上/佇列尚有 N 場未完成」。

**Assist 與 Auto 在 UI 上的差異**（保留）：
- Header 標籤（橘色「輔助模式」vs 藍色「自動模式」）。
- Auto 才有：Session 分組標題、「推薦上場」徽章、「系統自動微調」黃色提示區塊。
- Assist 才有：系統建議區只會有 0 或 1 張卡片，並有「換一組」按鈕；Auto 的系統建議卡片沒有「換一組」（因為是整批產生，沒有「換一組」的概念，只能用「自動微調」或手動交換）。
- Assist 頁面有「候位」清單區塊（顯示排隊順序 1,2,3...與各自等待時間）；Auto 頁面沒有做這個區塊（因為 Auto 的「候位」概念被 session 佇列取代）。

---

## 7. 結算頁（Stats）功能

1. 全部球員依 mmr 降冪列出：排名、姓名、最終積分（含相對 `initialMmr` 的漲跌顯示）、勝/負、勝率、總得分（`totalPoints`）、場次、總時數、總等待、最長等待、同隊次數明細、對戰次數明細。
2. 「簡易複製」按鈕：把 `姓名, 性別, 積分`（四捨五入）複製到剪貼簿，方便下次開團時用「批量匯入」貼回來延續積分。
3. 完整歷史紀錄列表（同 Run 頁的 History Modal 內容，但常駐顯示不用開 Modal）。
4. 「完成」按鈕：呼叫 `onReset` → `fullReset()`，清空一切回首頁。

---

## 8. 邊界情況與既有限制（Review 發現，供重寫時比對）

1. **重新整理頁面 = 全部資料消失**：所有狀態只存在 React state（記憶體），沒有任何持久化。→ 已與使用者確認，**重寫版本會加上 localStorage 自動存檔**（見決策紀錄）。
2. **兩種模式對「混合模式」的解析邏輯不一致**（5.6 vs 5.9-5）。→ 已與使用者確認，**重寫版本統一採用「場次計數」邏輯**（見決策紀錄）。
3. （原文件此處曾誤判 `lastMatchEndTime` 的寫入時機，經再次核對原始碼後更正：該欄位只在比賽結算時寫入，語意與命名一致，見第 3 節註記與 5.4 節，重寫版本沿用同名欄位、不需改名。）
4. **交換球員採用「直接 mutate 後 setState」的寫法**（`sourceMatch[selection.teamId].players[selection.index] = targetPlayer`）：技術上因為 `newQueue` 只是淺拷貝（`[...queue]`），實際上是在直接改寫 state 裡巢狀物件的內容，屬於 React anti-pattern（可能導致某些情境下的更新時序問題或難以追蹤的 bug）。重寫時必須改成不可變更新（immutable update）。
5. **Assist 與 Auto 兩個檔案高重複率**（約 70% 程式碼幾乎一致：場地格、統計/歷史/不計分/結算/結果 Modal、上場/交換/語音等 handler）。這是最大的可維護性問題，重寫時要抽成共用元件與共用 hook，只保留策略特有的排程邏輯與少數 UI 差異。
6. 結算（Stats）不會強制要求「場上/佇列淨空」，也不會把未完成場次併入歷史或給出警示——原樣保留但建議加強確認文案（不算新增功能，只是既有 Modal 文案優化）。
7. `Team.score` 與 `totalPoints` 並非使用者輸入的真實比分——系統沒有「輸入比分」的 UI，只有「隊1勝／平手／隊2勝」三個按鈕，對應寫入 `(s1,s2)=(1,0)`、`(0,0)`、`(0,1)`。`calculateNewMMR` 用 `score1===score2` 判斷平手並在 Elo 計算中視為 0.5:0.5，但寫回 `Team.score`/`totalPoints` 的仍是原始的 `(0,0)`，因此歷史紀錄上平手會顯示「0:0」。維持現狀。
8. 專案中 `stages/Run.tsx`、`utils/matchmaking.test.ts` 為空檔案（未使用/未完成的殘留），`@hello-pangea/dnd` 套件已安裝但整個專案沒有任何拖放（drag-and-drop）程式碼實際使用它，`metadata.json`/README 提到的 `GEMINI_API_KEY` 在程式碼中也完全沒被讀取——這些都是 AI Studio 匯出殘留的死程式碼/死依賴，重寫版本不會保留。

---

## 9. 決策紀錄（已與使用者確認，重寫版本據此調整行為）

| # | 議題 | 原系統行為 | 重寫版本行為 |
|---|---|---|---|
| D1 | 混合模式 (C) 的相近/平衡判斷邏輯 | Assist：比較 `history+activeMatches` 中兩種模式的場次多寡，較少者優先；Auto：純粹用 `sessionId % 2` 單雙交替 | **兩種策略統一改用「場次計數」邏輯**（比較目前累積場次，較少的模式優先），Auto 在產生每個 session 前即時重新計算 |
| D2 | 資料持久化 | 無，重新整理頁面全部歸零 | **加入 localStorage 自動儲存**：整個 App 狀態變動時自動寫入，重新載入頁面時偵測到既有存檔會詢問是否要回復；「完成」結算清空時同步清除存檔 |

---

## 10. 測試涵蓋範圍（來自原始 `*.test.ts`，作為重寫版本測試案例基礎）

原始測試檔（`mmr.test.ts`、`features.test.ts`、`integration.test.ts`、`simulation.test.ts`）涵蓋的情境，重寫時應至少等量覆蓋並補齊分支：

- CSV 解析：合法輸入、含錯誤行的部分成功。
- Elo 計算：equal MMR 情況下輸家/贏家對稱漲跌。
- 不計分比賽：積分不變但場次/夥伴/對手/時長正常累計。
- 候位排序：等待時間優先、場次數次優先。
- 衝突偵測：球員已在其他進行中比賽時偵測出來。
- 交換合法性：會造成重複球員的交換要被擋下。
- 單場建議：候位足夠才給建議、給的建議一定包含錨點、`blacklist` 換一組後仍包含錨點、候選不足時要回傳 `null`。
- 端對端模擬：14 人 2 場地跑 24 場混合手動/系統比賽後，場次數落差 ≤1、最長等待時間落差在合理範圍內（公平性驗證）。

---

## 11. 重寫版本新增功能（超出原系統範圍，使用者於重寫後追加需求）

以下功能原系統不存在，是重寫完成、實際上線試用後，使用者提出的新需求：

### 11.1 長按選單：修改 / 交換

比賽大廳的分組卡（手動分組、系統建議、預排順序皆適用）上，**長按**（滑鼠按住不放約 0.5 秒；觸控裝置為長按手勢）一位選手會跳出選單，提供兩個操作：

- **修改**：開啟選手清單（含場上/已排/建議狀態標示），可選名單中「任意」一位選手直接換上這個位置。會排除同一場比賽中其餘 3 人，避免選到已經在場上的隊友/對手造成重複。
- **交換**：與原有「點兩下交換」機制相同——選定後，再點大廳中任一位選手即可互換位置。

短按（點兩下）交換的原有機制完全不受影響，長按選單是額外的操作入口。技術實作：`hooks/useLongPress.ts`（區分短按/長按，並抑制長按後瀏覽器補發的 click 事件）、`domain/matchSwap.ts` 的 `replacePlayerInMatch`（修改用）與既有 `swapPlayersInQueue`（交換用）。

### 11.2 預排上場順序

情境：所有場地都在比賽中，管理員已經想好「場地一空出來，先讓哪一組上、再來哪一組」，希望先標記起來，稍後不用重新思考一次。

設計為一個獨立的「預排上場順序」區塊（顯示於場地格下方、系統建議對戰之上）：

- 每張分組卡（手動分組、系統建議，Assist / Auto 皆適用）新增一個「📌 加入預排上場順序」按鈕。點擊後，該分組會從原本的區塊移到「預排上場順序」區塊，並顯示順位（①②③...），**不會同時出現在兩個地方**。
- 預排順序區塊內每張卡片可以「上移」「下移」「移除」（移除後該分組會回到原本所屬的區塊）。
- 場地一空出來，順位最前面且所有選手都不在場上的那張卡片，會自動套用既有的「推薦上場」綠色高亮，並可直接按「立即上場」——此時系統建議對戰區塊**不會**再額外顯示另一個推薦（避免同時出現兩個互相衝突的建議）。
- 只要有人被送上場、刪除、或因選手被移除/請假而失效，會自動從預排順序中移除，不需手動維護。

技術實作：`domain/plannedOrder.ts`（純函式：新增/移除/搬移/解析成 Match[]/找出目前可上場的最前一項）、`AppState.plannedOrder: string[]`（比賽 id 陣列）、對應的 3 個 action（`PLANNED_ORDER_ADDED` / `REMOVED` / `MOVED`）、UI 元件 `components/match/PlannedOrderPanel.tsx`。

> 因為 `AppState` 多了 `plannedOrder` 欄位，localStorage 的存檔版本號同步從 v1 升級到 v2（見 `state/persistence.ts`），舊的存檔會被判定為不相容並自動捨棄，不會導致讀取到 `undefined` 而壞掉。

