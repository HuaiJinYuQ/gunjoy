# 目标
- 将 `pages/profile/profile.ts#L59-107` 的登录与缓存逻辑改为“缓存优先、失效则登录”的单一流程：用户进入 → 检查缓存登录态 → 有效则直接使用 → 无效则执行登录 → 缓存新登录态 → 执行业务初始化。

## 重构要点
### 1. 缓存登录态校验
- 新增 `isLoginStateValid(dbUser): boolean`：校验对象存在且包含 `openid` 或 `_id`。
- 读取 `dbUser` 和 `dbUserId`（可选），若有效：
  - `setData({ dbUser, isLoggedIn: true, hasUserInfo: true })`
  - 启动业务初始化：加载/合并 `userPreferences`（若缺失则生成默认值）。
  - 触发资料拉取以刷新（使用现有 `tryLoadProfileFromCloud`）。

### 2. 登录流程封装
- 新增 `performLogin(): Promise<void>`：
  - 调用 `wx.login` 获取 `code`。
  - 云函数 `userLogin`（已改为仅认证）返回用户文档（至少含 `_id/openid`）。
  - 缓存：`wx.setStorageSync('dbUser', user)` 与 `wx.setStorageSync('dbUserId', user._id)`。
  - `setData` 更新 `isLoggedIn/hasUserInfo` 并执行业务初始化与资料拉取。
  - 错误处理：显示 `登录失败` 提示。

### 3. onLoad 统一流程
- 获取 `statusBarHeight`（已改用 `wx.getWindowInfo`）。
- 读取缓存并校验：
  - `valid` → 使用缓存并业务初始化 → 异步刷新资料。
  - `invalid` → `await performLogin()`。
- 移除当前的重复弹窗授权逻辑与双重分支，保持单一路径，避免二次调用。

### 4. 业务初始化
- `initializeUserPreferencesFromDb(dbUser)`：若本地无 `userPreferences`，以 `dbUser.city` 生成默认偏好并缓存；保留现有字段结构。

### 5. 错误与日志
- 在 `performLogin` 与 `tryLoadProfileFromCloud` 打印简要日志，保留现有 `userLogin result`，便于排查。
- 对于空缓存与拉取失败提供用户友好提示，不影响正常使用。

## 代码变更范围
- `miniprogram/pages/profile/profile.ts`：
  - 替换 `onLoad` 中 `L59-107` 的分支为统一流程；新增两个辅助函数：`isLoginStateValid`、`performLogin` 和 `initializeUserPreferencesFromDb`。
  - 删除/调整弹窗调用，避免与统一流程冲突。
- 保持其它文件不变（云函数已按上一轮调整为“登录不更新资料”）。

## 测试用例
1. 空缓存进入：自动登录 → 缓存写入 → UI显示默认昵称/头像或已保存资料。
2. 部分缓存（仅 `userInfo`）：不视为已登录 → 执行登录 → 缓存与UI同步。
3. 完整缓存（`dbUser/dbUserId`）：直接使用 → 业务初始化 → 异步刷新不影响UI。
4. 登录失败：提示错误，不崩溃；再次进入能重试登录。
5. 基础库不同版本：`wx.getWindowInfo` 可用则用，否则回退 `getSystemInfoSync`（已实现）。

## 兼容性
- 不改变缓存键名（`dbUser`、`dbUserId`、`userPreferences`）。
- 登录接口与资料接口兼容当前前端调用。

请确认后，我将按上述方案重构 `profile.ts` 的登录与缓存逻辑，并补充小型辅助方法与错误处理。