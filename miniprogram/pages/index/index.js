// index.js
const app = getApp();

Page({
  data: {
    // 轮播图数据
    bannerShows: [],
    
    // 分类数据
    categories: [
      { name: '演唱会', type: 'concert', emoji: '🎤', color: '#FF6B35' },
      { name: '音乐会', type: 'music', emoji: '🎼', color: '#4ECDC4' },
      { name: '话剧', type: 'drama', emoji: '🎭', color: '#45B7D1' },
      { name: '展览', type: 'exhibition', emoji: '🎨', color: '#96CEB4' },
      { name: '舞蹈', type: 'dance', emoji: '💃', color: '#FFEAA7' }
    ],
    
    // 演出列表数据
    shows: [],
    isLoading: false,
    hasMore: true,
    
    // 分页参数
    page: 1,
    pageSize: 10,
    
    // 排序选项
    sortIndex: 0,
    sortOptions: [
      { name: '时间排序', value: 'showDate' },
      { name: '最新发布', value: 'createdAt' }
    ],
    
    // 筛选条件
    filterParams: {}
  },

  onLoad: function (options) {
    // 页面加载时初始化数据
    this.loadInitialData();
  },

  onShow: function () {
    // 页面显示时刷新收藏状态
    this.updateCollectionStatus();
  },

  onPullDownRefresh: function () {
    // 下拉刷新
    this.refreshData();
  },

  onReachBottom: function () {
    // 上拉加载更多
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadMoreShows();
    }
  },

  // 加载初始数据
  loadInitialData: function () {
    this.setData({ isLoading: true });
    
    Promise.all([
      this.loadBannerShows(),
      this.loadShows()
    ]).then(() => {
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('加载初始数据失败:', err);
      wx.stopPullDownRefresh();
    });
  },

  // 加载轮播图数据
  loadBannerShows: function () {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getShowList',
        data: {
          page: 1,
          pageSize: 5,
          sortBy: 'showDate',
          sortOrder: 'asc'
        },
        success: res => {
          if (res.result.code === 0) {
            const bannerShows = res.result.data.list.slice(0, 3).map(show => ({
              ...show,
              showDateStr: this.formatDate(show.showDate)
            }));
            
            this.setData({
              bannerShows: bannerShows
            });
          }
          resolve();
        },
        fail: reject
      });
    });
  },

  // 加载演出列表
  loadShows: function (reset = false) {
    const { page, pageSize, sortOptions, sortIndex, filterParams } = this.data;
    const currentPage = reset ? 1 : page;
    
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getShowList',
        data: {
          page: currentPage,
          pageSize: pageSize,
          sortBy: sortOptions[sortIndex].value,
          sortOrder: 'asc',
          ...filterParams
        },
        success: res => {
          if (res.result.code === 0) {
            const { list, total, hasMore } = res.result.data;
            const processedShows = list.map(show => ({
              ...show,
              showDateStr: this.formatDate(show.showDate),
              isCollected: false // 将在后续更新收藏状态
            }));
            
            const newShows = reset ? processedShows : [...this.data.shows, ...processedShows];
            
            this.setData({
              shows: newShows,
              hasMore: hasMore,
              page: currentPage + (reset ? 0 : 1),
              isLoading: false
            });
            
            // 更新收藏状态
            this.updateCollectionStatus();
          }
          resolve();
        },
        fail: reject
      });
    });
  },

  // 刷新数据
  refreshData: function () {
    this.setData({
      page: 1,
      shows: [],
      hasMore: true
    });
    
    this.loadInitialData();
  },

  // 加载更多演出
  loadMoreShows: function () {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    this.loadShows().catch(err => {
      console.error('加载更多演出失败:', err);
      this.setData({ isLoading: false });
    });
  },

  // 更新收藏状态
  updateCollectionStatus: function () {
    const openid = app.globalData.openid;
    if (!openid || this.data.shows.length === 0) return;
    
    wx.cloud.callFunction({
      name: 'getUserCollections',
      data: {
        openid: openid
      },
      success: res => {
        if (res.result.code === 0) {
          const collectedShowIds = res.result.data.map(item => item.showId);
          
          const updatedShows = this.data.shows.map(show => ({
            ...show,
            isCollected: collectedShowIds.includes(show.id)
          }));
          
          this.setData({
            shows: updatedShows
          });
        }
      },
      fail: err => {
        console.error('更新收藏状态失败:', err);
      }
    });
  },

  // 格式化日期
  formatDate: function (dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const showDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = showDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dateText = '';
    if (diffDays === 0) {
      dateText = '今天';
    } else if (diffDays === 1) {
      dateText = '明天';
    } else if (diffDays === 2) {
      dateText = '后天';
    } else if (diffDays > 0 && diffDays <= 7) {
      dateText = `${diffDays}天后`;
    } else {
      dateText = `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${weekDay}`;
  },

  // 获取分类颜色
  getCategoryColor: function (category) {
    const categoryMap = {
      'concert': '#FF6B35',
      'music': '#4ECDC4',
      'drama': '#45B7D1',
      'exhibition': '#96CEB4',
      'dance': '#FFEAA7',
      'other': '#DDA0DD'
    };
    return categoryMap[category] || '#DDA0DD';
  },

  // 事件处理函数
  
  // 点击轮播图
  onBannerTap: function (e) {
    const show = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${show.id}`
    });
  },

  // 点击分类
  onCategoryTap: function (e) {
    const category = e.currentTarget.dataset.category;
    
    // 设置筛选条件并跳转到筛选页面
    this.setData({
      filterParams: { category: category },
      page: 1,
      shows: []
    });
    
    this.loadShows(true);
  },

  // 点击演出卡片
  onShowTap: function (e) {
    const showId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${showId}`
    });
  },

  // 点击收藏按钮
  onCollectTap: function (e) {
    e.stopPropagation();
    
    const showId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const show = this.data.shows[index];
    
    if (!app.globalData.openid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const action = show.isCollected ? 'cancel' : 'collect';
    
    wx.cloud.callFunction({
      name: 'toggleCollection',
      data: {
        showId: showId,
        action: action
      },
      success: res => {
        if (res.result.code === 0) {
          // 更新本地状态
          const updatedShows = [...this.data.shows];
          updatedShows[index].isCollected = !show.isCollected;
          
          this.setData({
            shows: updatedShows
          });
          
          wx.showToast({
            title: action === 'collect' ? '已收藏' : '已取消收藏',
            icon: 'success',
            duration: 1500
          });
        }
      },
      fail: err => {
        console.error('收藏操作失败:', err);
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 排序变化
  onSortChange: function (e) {
    const sortIndex = e.detail.value;
    
    this.setData({
      sortIndex: sortIndex,
      page: 1,
      shows: []
    });
    
    this.loadShows(true);
  },

  // 跳转到搜索页面
  goToSearch: function () {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 跳转到筛选页面
  goToFilter: function () {
    wx.navigateTo({
      url: '/pages/filter/filter'
    });
  }
});