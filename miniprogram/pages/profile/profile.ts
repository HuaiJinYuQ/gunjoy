// miniprogram/pages/profile/profile.ts
interface UserInfo {
  nickName: string;
  avatarUrl: string;
  gender: number;
  city: string;
  province: string;
  country: string;
}

interface UserPreferences {
  genres: string[];
  cities: string[];
  priceRange: [number, number];
}

Page({
  data: {
    userInfo: null as UserInfo | null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    isLoggedIn: false,
    preferences: {
      genres: [],
      cities: [],
      priceRange: [0, 1000]
    } as UserPreferences,
    favoriteCount: 0,
    noteCount: 0,
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
    // 检查是否支持 getUserProfile
    if (wx.getUserProfile!== undefined) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
        isLoggedIn: true
      });
    }
    
    // 加载用户偏好设置
    this.loadUserPreferences();
  },

  getUserProfile() {
    // 推荐使用 wx.getUserProfile 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
          isLoggedIn: true
        });
        wx.setStorageSync('userInfo', res.userInfo);
        
        // 初始化用户偏好
        this.initializeUserPreferences(res.userInfo);
      },
      fail: () => {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'error'
        });
      }
    });
  },

  getUserInfo(e: any) {
    // 兼容旧版本
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true,
        isLoggedIn: true
      });
      wx.setStorageSync('userInfo', e.detail.userInfo);
      this.initializeUserPreferences(e.detail.userInfo);
    }
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

  onAbout() {
    wx.showModal({
      title: '关于滚聚',
      content: '滚聚 - 摇滚乐迷的专属社区\n版本：v1.0.0\n\n让每一次摇滚现场都充满回忆',
      showCancel: false
    });
  }
});