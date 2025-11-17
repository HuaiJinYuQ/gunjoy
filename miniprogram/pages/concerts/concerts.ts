// miniprogram/pages/concerts/concerts.ts
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

Page({
  data: {
    concerts: [] as Concert[],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    city: '全部城市',
    genre: '全部风格',
    priceRange: '全部价格',
    cities: ['全部城市', '北京', '上海', '广州', '深圳', '成都', '西安', '武汉'],
    genres: ['全部风格', '摇滚', '朋克', '金属', '独立', '民谣摇滚'],
    priceRanges: ['全部价格', '0-100', '100-300', '300-500', '500+']
  },

  onLoad() {
    this.loadConcerts();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadConcerts();
    }
  },

  onPullDownRefresh() {
    this.setData({
      concerts: [],
      page: 1,
      hasMore: true
    });
    this.loadConcerts(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadConcerts(callback?: Function) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      // 模拟演出数据
      const mockConcerts: Concert[] = [
        {
          _id: '1',
          title: '痛仰乐队2024全国巡演·西安站',
          description: '痛仰乐队"世界会变好"全国巡演，带着全新的音乐作品和舞台呈现，与乐迷一起感受摇滚的力量。',
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
          description: '新裤子乐队2024年全新专辑巡演，带来最具感染力的现场表演。',
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
        },
        {
          _id: '3',
          title: '二手玫瑰「摇滚牡丹亭」·上海站',
          description: '二手玫瑰将传统戏曲与摇滚完美融合，带来独特的音乐体验。',
          date: '2024-12-25',
          venue: '梅赛德斯奔驰文化中心',
          city: '上海',
          price: 320,
          bands: ['二手玫瑰'],
          genres: ['摇滚', '民谣摇滚'],
          poster: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Rock%20concert%20poster%2C%20second%20hand%20rose%20band%2C%20traditional%20Chinese%20opera%20elements%2C%20red%20and%20gold%20colors%2C%20peony%20flowers%2C%20professional%20design&image_size=portrait_4_3',
          status: 'upcoming',
          createdAt: '2024-11-03',
          updatedAt: '2024-11-03'
        }
      ];
      
      const newConcerts = mockConcerts.map(concert => ({
        ...concert,
        dateFormatted: this.formatDate(concert.date),
        priceFormatted: this.formatPrice(concert.price)
      }));
      
      this.setData({
        concerts: [...this.data.concerts, ...newConcerts],
        page: this.data.page + 1,
        hasMore: this.data.page < 3 // 模拟只有3页数据
      });
      
    } catch (error) {
      console.error('加载演出列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
      callback && callback();
    }
  },

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  },

  formatPrice(price: number): string {
    return `¥${price}`;
  },

  onCityChange(e: any) {
    const index = e.detail.value;
    this.setData({
      city: this.data.cities[index],
      concerts: [],
      page: 1,
      hasMore: true
    });
    this.loadConcerts();
  },

  onGenreChange(e: any) {
    const index = e.detail.value;
    this.setData({
      genre: this.data.genres[index],
      concerts: [],
      page: 1,
      hasMore: true
    });
    this.loadConcerts();
  },

  onPriceRangeChange(e: any) {
    const index = e.detail.value;
    this.setData({
      priceRange: this.data.priceRanges[index],
      concerts: [],
      page: 1,
      hasMore: true
    });
    this.loadConcerts();
  },

  onConcertTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/concert-detail/concert-detail?id=${id}`
    });
  },

  onFavoriteTap(e: any) {
    e.stopPropagation();
    const { id } = e.currentTarget.dataset;
    // TODO: 实现收藏功能
    wx.showToast({
      title: '已收藏',
      icon: 'success'
    });
  }
});