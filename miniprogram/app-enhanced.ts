// 云开发环境初始化配置
// 在 app.js 中添加云开发初始化

App({
  globalData: {
    userInfo: null,
    cloudEnv: 'gunjoy-env-1g2h3j4k5l6m7n8o9p0q' // 替换为你的云开发环境ID
  },
  
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: this.globalData.cloudEnv,
        traceUser: true,
      })
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    // 检查用户登录状态
    this.checkLoginStatus()
  },

  // 检查用户登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      // 验证用户token是否有效
      this.validateUserToken()
    }
  },

  // 验证用户token
  validateUserToken() {
    wx.cloud.callFunction({
      name: 'gunjoy',
      data: {
        type: 'validateUser',
        userInfo: this.globalData.userInfo
      },
      success: res => {
        if (res.result.code !== 0) {
          // token无效，清除用户信息
          this.globalData.userInfo = null
          wx.removeStorageSync('userInfo')
        }
      },
      fail: err => {
        console.error('验证用户失败', err)
      }
    })
  },

  // 全局数据
  globalData: {
    userInfo: null,
    cloudEnv: 'gunjoy-env-1g2h3j4k5l6m7n8o9p0q'
  }
})