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

interface Post {
  _id: string;
  userName: string;
  userAvatar: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

// 获取应用实例
const app = getApp<IAppOption>()

Page({
  data: {
    recommendedConcerts: [] as Concert[],
    posts: [] as (Post & { timeFormatted: string })[],
    hasUserInfo: false,
    motto: '滚聚 - 摇滚乐迷的专属社区',
    loadingPosts: false,
    hasMorePosts: true,
    postPage: 1,
    postPageSize: 10
  },

  onLoad() {
    this.loadRecommendedConcerts();
    this.checkUserLoginStatus();
    this.loadPosts();
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

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  loadPosts() {
    if (this.data.loadingPosts || !this.data.hasMorePosts) return;
    this.setData({ loadingPosts: true });
    const page = this.data.postPage;
    const size = this.data.postPageSize;
    const base: Post[] = [
      {
        _id: 'p1',
        userName: '摇滚青年',
        userAvatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83ep0SCS1E1nP9h5iaA3kibia7z2ibibibibibibibibib/132',
        content: '昨晚在工体看新裤子，现场氛围炸裂！求同场朋友的歌单～',
        images: ['https://picsum.photos/seed/rock1/320/240'],
        likes: 32,
        comments: 12,
        isLiked: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        _id: 'p2',
        userName: '现场达人',
        userAvatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/2ic0S1E1nP9h5iaA3kibia7z2ibibibibibibibibib/132',
        content: '痛仰西安站已购票，入场口有没有更快的路线推荐？',
        images: [],
        likes: 18,
        comments: 5,
        isLiked: false,
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      },
      {
        _id: 'p3',
        userName: '音乐发烧友',
        userAvatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83ep0SCS1E1nP9h5iaA3kibia7z2ibibibibibibibibib/132',
        content: '大家觉得朋克与金属的融合风格如何？最近迷上了这类现场。',
        images: ['https://picsum.photos/seed/rock2/320/240', 'https://picsum.photos/seed/rock3/320/240'],
        likes: 7,
        comments: 3,
        isLiked: false,
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      }
    ];
    const start = (page - 1) * size;
    const batch = base.slice(0, size).map(p => ({
      ...p,
      timeFormatted: this.formatTime(p.createdAt)
    }));
    const posts = (this.data.posts || []).concat(batch);
    const hasMore = page < 3;
    this.setData({
      posts,
      postPage: page + 1,
      hasMorePosts: hasMore,
      loadingPosts: false
    });
  },

  onLikePost(e: any) {
    const { id } = e.currentTarget.dataset;
    const posts = this.data.posts.map(p => {
      if (p._id === id) {
        const liked = !p.isLiked;
        return { ...p, isLiked: liked, likes: liked ? p.likes + 1 : p.likes - 1 };
      }
      return p;
    });
    this.setData({ posts });
  },

  onPostTap() {
    wx.showToast({ title: '帖子详情开发中', icon: 'none' });
  },

  onReachBottom() {
    this.loadPosts();
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
      url: `/pages/detail/detail?id=${id}`
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
