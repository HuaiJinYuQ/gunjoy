# 目标
- 将登录流程与用户资料更新彻底分离：登录仅做身份认证与用户存在性检查，不更新昵称/头像等资料字段。
- 资料读取与更新统一由独立接口处理，保持与现有客户端兼容。

## 云函数调整
### userLogin（仅认证，不更新资料）
- 行为更新：
  - 使用 `auth.code2Session` 获取 `openid/unionid`。
  - 查询 `users` 集合是否存在 `openid` 记录：
    - 不存在 → 创建最小化用户文档：`{ openid, unionid, createdAt, updatedAt }`；不写 `nickname/avatar` 等资料。
    - 已存在 → 直接返回现有记录，不更新资料字段（包括 `nickname/avatar/gender/city...`）。
- 输入校验：
  - 校验 `loginCode` 是否存在（可选，若无则依赖 `wxContext.OPENID`）。
  - 捕获 `code2Session` 异常并返回明确的错误码与信息：`{ code:-1, message:'code2Session failed' }`。
- 兼容性：
  - 不改变已存在用户的 `_id` 与 `openid`（userid 不变）。
  - 不再写入 `nickname/avatar`，避免与资料更新流程耦合。

### userGetProfile（读取资料）
- 保持根据 `OPENID` 查询用户并返回资料的行为。
- 不进行任何写操作，仅返回 `{ ...user, age, zodiac }`。
- 若需要按 `_id` 精确读取，新增 `userGetProfileById`（见下）。

### userGetProfileById（新增，可选）
- 输入：`id`（字符串，用户文档 `_id`）。
- 行为：通过 `_id` 查询并返回用户文档及派生字段 `{ age, zodiac }`。
- 错误处理：`id` 缺失或查询为空时返回 `{ code:-1, message:'用户不存在' }`。

### userUpdateProfile（资料更新唯一入口）
- 允许字段（白名单）：`nickname, avatarUrl, avatar, gender, birthday, city, province, signature, tags`。
- 输入校验：
  - 空更新直接返回错误：`{ code:-1, message:'无可更新字段' }`。
  - 字段类型简单校验（字符串/数组）。
- 更新后通过 `_id` 读取最新文档并返回 `{ ...latest, age, zodiac }`。

## 前端配合
- 登录成功：
  - 仅缓存 `dbUser`（可能只有身份字段）与 `dbUserId`（`_id`）。
  - UI 昵称/头像使用默认值回退（已实现），提示去“编辑资料”完善信息。
- 资料拉取：
  - 若无缓存或需拉取，优先调用 `userGetProfile`；可选回退调用 `userGetProfileById`（使用缓存 `_id`）。
- 资料更新：
  - 编辑页仅调用 `userUpdateProfile` 更新资料；登录流程不做资料更新。

## 错误与日志
- 云函数：统一返回 `{ code, message, data }`；对 `code2Session`、DB 查询/更新失败返回明确错误码。
- 前端：在登录与拉取资料时打印简要日志，便于定位字段是否存在（保持已有日志）。

## 测试用例
1. 新用户首次登录：
   - `userLogin` 创建最小文档，不含 `nickname/avatar`；UI显示默认头像与“未登录”。
   - 进入编辑页，调用 `userUpdateProfile` 更新资料后返回正确渲染。
2. 老用户登录：
   - `userLogin` 不更新资料，返回现有文档；UI正常显示已保存的昵称与头像。
3. 缓存缺失：
   - 页面自动调用 `userGetProfile` 拉取资料；如无返回资料字段，则保持默认显示。
4. 兼容旧客户端：
   - 旧版仍可调用 `userUpdateProfile` 完成资料更新；登录接口兼容返回结构。

## 兼容性与影响
- 不改变集合结构与主键 `_id/openid`。
- 登录接口不再写入资料，避免与权限能力绑定（如 `getUserProfile`）产生耦合。
- 现有前端逻辑无需大改，仅确保登录后默认显示与编辑流程正常。

请确认以上方案，我将按此计划更新 `cloudfunctions/user/index.js` 的 `userLogin` 行为（去除资料更新），并补充 `userGetProfileById` 接口；随后调整前端调用以利用缓存 `_id` 在必要时按 id 拉取。