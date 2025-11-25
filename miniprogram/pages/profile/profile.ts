// miniprogram/pages/profile/profile.ts
interface UserInfo {
  nickName: string;
  avatarUrl: string;
  gender: number;
  city: string;
  province: string;
  country: string;
}

interface DBUser {
  _id: string;
  openid: string;
  unionid?: string;
  nickname?: string;
  avatarUrl?: string;
  gender?: number;
  birthday?: string;
  city?: string;
  province?: string;
  age?: number | null;
  zodiac?: string | null;
  signature?: string;
  tags?: string[];
}

interface UserPreferences {
  genres: string[];
  cities: string[];
  priceRange: [number, number];
}

Page({
  data: {
    userInfo: null as UserInfo | null,
    dbUser: null as DBUser | null,
    hasUserInfo: false,
    isLoggedIn: false,
    statusBarHeight: 0,
    navContentHeight: 44,
    preferences: {
      genres: [],
      cities: [],
      priceRange: [0, 1000]
    } as UserPreferences,
    favoriteCount: 0,
    noteCount: 0,
    zodiac: '',
    genres: ['摇滚', '朋克', '金属', '独立', '民谣摇滚', '电子摇滚'],
    cities: ['北京', '上海', '广州', '深圳', '成都', '西安', '武汉', '杭州'],
    priceRanges: [
      { label: '0-100', value: [0, 100] },
      { label: '100-300', value: [100, 300] },
      { label: '300-500', value: [300, 500] },
      { label: '500+', value: [500, 2000] }
    ]
  },

  onLoad() {
    const info: any = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = info && info.statusBarHeight ? info.statusBarHeight : 0
    this.setData({ statusBarHeight })
    this.checkLoginStatus().then(() => {
      if (this.data.isLoggedIn) this.tryLoadProfileFromCloud()
      this.loadSysConfig()
    })
  },

  //#region 用户登录与缓存
  checkLoginStatus(): Promise<any> {
    return new Promise((resolve) => {
      const loginInfo = wx.getStorageSync('loginInfo')
      const now = Date.now()
      if (loginInfo && loginInfo.expireTime && now < loginInfo.expireTime && (loginInfo.dbUser || loginInfo.userId)) {
        if (loginInfo.dbUser) {
          const dbUser = loginInfo.dbUser as DBUser
          this.setData({ dbUser, isLoggedIn: true, hasUserInfo: true })
          wx.setStorageSync('dbUser', dbUser)
          if ((dbUser as any)._id) wx.setStorageSync('dbUserId', (dbUser as any)._id)
          this.initializeUserPreferencesFromDb(dbUser)
          resolve(loginInfo)
        } else if (loginInfo.userId) {
          wx.cloud.callFunction({ name: 'user', data: { type: 'userGetProfileById', id: loginInfo.userId } })
            .then((r: any) => {
              if (r.result && r.result.code === 0) {
                const user = r.result.data as DBUser
                this.setData({ dbUser: user, isLoggedIn: true, hasUserInfo: true, zodiac: (user as any).zodiac || '' })
                wx.setStorageSync('dbUser', user)
                if ((user as any)._id) wx.setStorageSync('dbUserId', (user as any)._id)
                this.initializeUserPreferencesFromDb(user)
                resolve({ ...loginInfo, dbUser: user })
              } else {
                wx.removeStorageSync('loginInfo')
                this.performLogin().then(resolve).catch(() => resolve(null))
              }
            })
            .catch(() => { wx.removeStorageSync('loginInfo'); this.performLogin().then(resolve).catch(() => resolve(null)) })
        }
      } else {
        wx.removeStorageSync('loginInfo')
        this.performLogin().then(resolve).catch(() => resolve(null))
      }
    })
  },


  

  getUserProfile() {
    this.onLoginClick()
  },

  getUserInfo() {
    this.onLoginClick()
  },

  onLoginClick() {
    this.performLogin()
  },

  initializeUserPreferences(userInfo: UserInfo) {
    // 根据用户信息初始化偏好设置
    const defaultPreferences: UserPreferences = {
      genres: ['摇滚'],
      cities: [userInfo.city || '北京'],
      priceRange: [0, 500]
    };
    
    this.setData({
      preferences: defaultPreferences
    });
    
    wx.setStorageSync('userPreferences', defaultPreferences);
  },

  loadUserPreferences() {
    const preferences = wx.getStorageSync('userPreferences');
    if (preferences) {
      this.setData({
        preferences: preferences
      });
    }
  },

  onGenreChange(e: any) {
    const { index } = e.currentTarget.dataset;
    const genre = this.data.genres[index];
    const preferences = this.data.preferences;
    
    const genreIndex = preferences.genres.indexOf(genre);
    if (genreIndex > -1) {
      preferences.genres.splice(genreIndex, 1);
    } else {
      preferences.genres.push(genre);
    }
    
    this.setData({
      preferences: preferences
    });
    
    wx.setStorageSync('userPreferences', preferences);
  },

  onCityChange(e: any) {
    const { index } = e.currentTarget.dataset;
    const city = this.data.cities[index];
    const preferences = this.data.preferences;
    
    const cityIndex = preferences.cities.indexOf(city);
    if (cityIndex > -1) {
      preferences.cities.splice(cityIndex, 1);
    } else {
      preferences.cities.push(city);
    }
    
    this.setData({
      preferences: preferences
    });
    
    wx.setStorageSync('userPreferences', preferences);
  },

  onPriceRangeChange(e: any) {
    const { index } = e.currentTarget.dataset;
    const priceRange = this.data.priceRanges[index].value;
    const preferences = this.data.preferences;
    
    preferences.priceRange = priceRange as [number, number];
    
    this.setData({
      preferences: preferences
    });
    
    wx.setStorageSync('userPreferences', preferences);
  },


  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('userPreferences');
          
          this.setData({
            userInfo: null,
            dbUser: null,
            hasUserInfo: false,
            isLoggedIn: false,
            preferences: {
              genres: [],
              cities: [],
              priceRange: [0, 1000]
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  tryLoadProfileFromCloud() {
    const id = wx.getStorageSync('dbUserId')
    const req = id ? { type: 'userGetProfileById', id } : { type: 'userGetProfile' }
    wx.cloud.callFunction({ name: 'user', data: req })
      .then((r: any) => {
        if (r.result && r.result.code === 0) {
          const user = r.result.data as DBUser
          this.setData({
            dbUser: user,
            isLoggedIn: true,
            hasUserInfo: true,
            zodiac: (user as any).zodiac || ''
          })
          wx.setStorageSync('dbUser', user)
          if ((user as any)._id) wx.setStorageSync('dbUserId', (user as any)._id)
          this.initializeUserPreferencesFromDb(user)
          this.loadSysConfig()
        } else {
          wx.showToast({ title: '资料获取失败', icon: 'none' })
        }
      })
      .catch(() => { wx.showToast({ title: '资料获取失败', icon: 'none' }) })
  },



  performLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          wx.cloud.callFunction({ name: 'user', data: { type: 'userLogin', loginCode: loginRes.code } })
            .then((r: any) => {
              if (r.result && r.result.code === 0) {
                const dbUser = r.result.data as DBUser
                this.setData({ dbUser, hasUserInfo: true, isLoggedIn: true })
                wx.setStorageSync('dbUser', dbUser)
                if ((dbUser as any)._id) wx.setStorageSync('dbUserId', (dbUser as any)._id)
                const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000
                const loginInfo = { userId: (dbUser as any)._id, expireTime, dbUser }
                wx.setStorageSync('loginInfo', loginInfo)
                this.initializeUserPreferencesFromDb(dbUser)
                resolve(loginInfo)
              } else {
                wx.showToast({ title: '登录失败', icon: 'none' })
                reject(new Error('login failed'))
              }
            })
            .catch((e: any) => { wx.showToast({ title: '登录失败', icon: 'none' }); reject(e) })
        },
        fail: () => { wx.showToast({ title: '登录态获取失败', icon: 'none' }); reject(new Error('wx.login failed')) }
      })
    })
  },
  //#endregion

  initializeUserPreferencesFromDb(dbUser: any) {
    const existing = wx.getStorageSync('userPreferences')
    if (existing) return
    const city = (dbUser && dbUser.city) || '北京'
    const defaultPreferences: UserPreferences = { genres: ['摇滚'], cities: [city], priceRange: [0, 500] }
    this.setData({ preferences: defaultPreferences })
    wx.setStorageSync('userPreferences', defaultPreferences)
  },

  loadSysConfig() {
    const cached = wx.getStorageSync('sysConfig')
    const now = Date.now()
    if (cached && cached.expireTime && now < cached.expireTime) {
      const data = cached.data || {}
      if (Array.isArray(data.cities)) this.setData({ cities: data.cities })
      if (Array.isArray(data.music_tags)) this.setData({ genres: data.music_tags })
      return
    }
    wx.cloud.callFunction({ name: 'config', data: { type: 'getConfigs', types: ['cities', 'music_tags'] } })
      .then((r: any) => {
        if (r.result && r.result.code === 0) {
          const data = r.result.data || {}
          if (Array.isArray(data.cities)) this.setData({ cities: data.cities })
          if (Array.isArray(data.music_tags)) this.setData({ genres: data.music_tags })
          wx.setStorageSync('sysConfig', { data, expireTime: now + 24 * 60 * 60 * 1000 })
        }
      })
      .catch(() => {})
  },

  

  goToProfileEdit() {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' })
  },

  onMyPosts() {
    wx.showToast({ title: '开发中', icon: 'none' })
  },

  onFeedback() {
    wx.showToast({ title: '反馈入口开发中', icon: 'none' })
  },

  onSettings() {
    wx.showToast({ title: '设置开发中', icon: 'none' })
  },

  onMyFavorites() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  onMyNotes() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  onConcertOrders() {
    wx.showToast({ title: '演出订单开发中', icon: 'none' })
  },

  onCrowdOrders() {
    wx.showToast({ title: '众筹订单开发中', icon: 'none' })
  },

  onMerchOrders() {
    wx.showToast({ title: '周边订单开发中', icon: 'none' })
  },

  onAddress() {
    wx.showToast({ title: '收货地址开发中', icon: 'none' })
  },

  onAudience() {
    wx.showToast({ title: '常用观演人开发中', icon: 'none' })
  },

  onCoupons() {
    wx.showToast({ title: '优惠券开发中', icon: 'none' })
  },

  onHelpCenter() {
    wx.showToast({ title: '帮助中心开发中', icon: 'none' })
  },

  onCustomerService() {
    wx.showToast({ title: '客服电话开发中', icon: 'none' })
  },

  onAbout() {
    wx.showModal({
      title: '关于滚聚',
      content: '滚聚 - 摇滚的人，终会相聚\n版本：v1.0.0',
      showCancel: false
    });
  }
});