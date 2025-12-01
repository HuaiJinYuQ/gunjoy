# 滚聚（GunJoy） - 微信小程序

> 声明：本应用正在开发中，当前仅作为本人学习使用；不用于商用发布。
> 联系方式（微信）：`HuaiJinYuQ`

基于微信云开发的演出活动数据聚合平台，帮助用户发现和浏览各大平台的演出信息。

## 功能特性

- 🎭 **演出浏览**: 展示各大平台的演出信息
- 🔍 **智能搜索**: 支持关键词搜索和高级筛选
- 📱 **分类导航**: 按演出类型快速筛选
- ❤️ **收藏功能**: 收藏感兴趣的演出
- 🏠 **个人中心**: 管理个人信息和收藏列表
- 🔄 **数据同步**: 定时同步各大平台演出数据

## 技术架构

- **前端**: 微信小程序原生框架
- **后端**: 微信云开发（CloudBase）
- **数据库**: 云开发数据库
- **存储**: 云开发云存储
- **函数计算**: 云开发云函数

## 快速开始

### 1. 环境准备

- 微信开发者工具
- 微信小程序账号
- 开通微信云开发

### 2. 项目配置

1. 克隆项目到本地
2. 使用微信开发者工具打开项目
3. 修改 `cloud.config.json` 中的环境ID
4. 修改 `app.js` 中的云开发环境ID

### 3. 云开发配置

#### 创建数据库集合

在微信开发者工具的云开发控制台中创建以下集合：

- `shows` - 演出数据
- `users` - 用户数据
- `collections` - 用户收藏
- `search_history` - 搜索历史
- `system_logs` - 系统日志

#### 设置数据库权限

为每个集合设置相应的权限规则（参考 `database-init.js`）：

- `shows`: 公开可读，管理员可写
- `users`: 仅本人可读写
- `collections`: 仅本人可读写
- `search_history`: 仅本人可读写
- `system_logs`: 仅管理员可读写

#### 创建云函数

在微信开发者工具中创建以下云函数：

- `login` - 用户登录
- `getShowList` - 获取演出列表
- `getShowDetail` - 获取演出详情
- `toggleCollection` - 收藏操作
- `syncShowData` - 同步演出数据

### 4. 部署云函数

在微信开发者工具中右键点击云函数目录，选择"上传并部署：云端安装依赖"。

### 5. 数据初始化

1. 手动添加一些测试数据到 `shows` 集合
2. 或者运行 `syncShowData` 云函数同步模拟数据

## 项目结构

```
/Users/zhangkai/project/wechat_projects/gunjoy/
├── cloudfunctions/          # 云函数
│   ├── login/              # 用户登录
│   ├── getShowList/        # 获取演出列表
│   ├── getShowDetail/      # 获取演出详情
│   ├── toggleCollection/   # 收藏操作
│   └── syncShowData/       # 数据同步
├── miniprogram/            # 小程序前端
│   ├── pages/              # 页面文件
│   │   ├── index/          # 首页
│   │   ├── detail/         # 演出详情
│   │   ├── profile/        # 个人中心
│   │   ├── search/         # 搜索页面
│   │   ├── filter/         # 筛选页面
│   │   └── collection/     # 收藏列表
│   ├── utils/              # 工具函数
│   └── images/             # 图片资源
├── app.js                  # 应用入口
├── app.json                # 应用配置
├── app.wxss                # 全局样式
└── project.config.json     # 项目配置
```

## 开发指南

### 页面开发

每个页面包含以下文件：
- `.js` - 页面逻辑
- `.wxml` - 页面结构
- `.wxss` - 页面样式
- `.json` - 页面配置

### 云函数开发

云函数使用 Node.js 开发，每个云函数包含：
- `index.js` - 函数入口
- `package.json` - 依赖配置
- `config.json` - 权限配置

### 数据模型

#### 演出数据 (shows)
```javascript
{
  _id: string,
  title: string,          // 演出标题
  description: string,    // 演出描述
  poster: string,         // 海报URL
  showDate: Date,         // 演出时间
  venue: string,          // 演出场馆
  city: string,           // 城市
  category: string,       // 演出类型
  priceRange: string,     // 价格范围
  bookingUrl: string,     // 购票链接
  sourcePlatform: string, // 数据来源平台
  sourceId: string,       // 源平台ID
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

#### 用户数据 (users)
```javascript
{
  _id: string,
  openid: string,         // 微信openid
  nickname: string,       // 昵称
  avatarUrl: string,      // 头像URL
  createdAt: Date,        // 创建时间
  lastLoginAt: Date       // 最后登录时间
}
```

#### 收藏数据 (collections)
```javascript
{
  _id: string,
  userId: string,         // 用户ID
  showId: string,         // 演出ID
  createdAt: Date         // 收藏时间
}
```

## API 接口

### 获取演出列表
```
GET /getShowList
参数:
- page: 页码
- pageSize: 每页数量
- keyword: 搜索关键词
- category: 演出类型
- city: 城市
- dateRange: 日期范围
- priceRange: 价格范围
```

### 获取演出详情
```
GET /getShowDetail
参数:
- id: 演出ID
```

### 收藏操作
```
POST /toggleCollection
参数:
- showId: 演出ID
- action: collect/cancel
```

## 部署上线

1. 在微信开发者工具中点击"上传"
2. 在小程序管理后台提交审核
3. 审核通过后发布上线

## 注意事项

1. 确保云开发环境已开通
2. 数据库权限设置正确
3. 云函数已部署到云端
4. 图片资源已上传到云存储
5. API密钥等敏感信息不要提交到代码仓库

## 后续优化

- [ ] 添加更多数据源平台
- [ ] 实现智能推荐算法
- [ ] 添加演出提醒功能
- [ ] 优化搜索体验
- [ ] 添加用户评论功能
- [ ] 实现演出日历视图

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。

---

© 2024 演出活动数据聚合平台
