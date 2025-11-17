// miniprogram/pages/index/index.ts
interface Concert {
  _id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  city: string;
  price: number;
  bands: string[];
  genres: string[];
  poster: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  createdAt: string;
  updatedAt: string;
}

// 获取应用实例
const app = getApp<IAppOption>()

Page({
  data: {
    recommendedConcerts: [] as Concert[],
    hasUserInfo: false,
    motto: '滚聚 - 摇滚乐迷的专属社区'
  },

  onLoad() {
    this.loadRecommendedConcerts();
    this.checkUserLoginStatus();
  },

  onShow() {
    this.checkUserLoginStatus();
  },

  checkUserLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      hasUserInfo: !!userInfo
    });
  },

  loadRecommendedConcerts() {
    // 模拟推荐演出数据
    const mockConcerts: Concert[] = [
      {
        _id: '1',
        title: '痛仰乐队2024全国巡演·西安站',
        description: '痛仰乐队"世界会变好"全国巡演',
        date: '2024-12-15',
        venue: '西安音乐厅',
        city: '西安',
        price: 280,
        bands: ['痛仰乐队'],
        genres: ['摇滚'],
        poster: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Rock%20concert%20poster%2C%20pain%20band%2C%20red%20and%20black%20colors%2C%20electric%20guitar%2C%20crowd%20energy%2C%20professional%20design&image_size=portrait_4_3',
        status: 'upcoming',
        createdAt: '2024-11-01',
        updatedAt: '2024-11-01'
      },
      {
        _id: '2',
        title: '新裤子乐队「北海怪兽」巡演·北京站',
        description: '新裤子乐队2024年全新专辑巡演',
        date: '2024-12-20',
        venue: '工人体育馆',
        city: '北京',
        price: 380,
        bands: ['新裤子乐队'],
        genres: ['摇滚', '朋克'],
        poster: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Rock%20concert%20poster%2C%20new%20pants%20band%2C%20vibrant%20colors%2C%20retro%20style%2C%20synthwave%20aesthetic%2C%20professional%20design&image_size=portrait_4_3',
        status: 'upcoming',
        createdAt: '2024-11-02',
        updatedAt: '2024-11-02'
      }
    ];

    const formattedConcerts = mockConcerts.map(concert => ({
      ...concert,
      dateFormatted: this.formatDate(concert.date)
    }));

    this.setData({
      recommendedConcerts: formattedConcerts
    });
  },

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  },

  goToConcerts() {
    wx.switchTab({
      url: '/pages/concerts/concerts'
    });
  },

  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  goToConcertDetail(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/concert-detail/concert-detail?id=${id}`
    });
  },

  showFeature() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 兼容旧版本的函数
  toCases() {
    wx.navigateTo({
      url: '../cases/cases',
    });
  }
});
