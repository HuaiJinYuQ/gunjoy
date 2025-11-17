// miniprogram/pages/concert-detail/concert-detail.ts
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

interface Comment {
  _id: string;
  concertId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

Page({
  data: {
    concert: null as Concert | null,
    comments: [] as Comment[],
    loading: true,
    isFavorited: false,
    commentInput: '',
    userInfo: null as any,
    hasUserInfo: false
  },

  onLoad(options: any) {
    const { id } = options;
    if (id) {
      this.loadConcertDetail(id);
      this.loadComments(id);
    }
    
    // 检查用户登录状态
    this.checkUserLoginStatus();
  },

  checkUserLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: userInfo,
      hasUserInfo: !!userInfo
    });
  },

  async loadConcertDetail(id: string) {
    this.setData({ loading: true });
    
    try {
      // 模拟从缓存或API获取演出详情
      const mockConcert: Concert = {
        _id: id,
        title: '痛仰乐队2024全国巡演·西安站',
        description: '痛仰乐队"世界会变好"全国巡演，带着全新的音乐作品和舞台呈现，与乐迷一起感受摇滚的力量。这场演出将带来他们的经典曲目以及最新专辑中的作品，现场氛围必将热烈非凡。',
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
      };
      
      this.setData({
        concert: mockConcert,
        loading: false
      });
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: mockConcert.title
      });
      
    } catch (error) {
      console.error('加载演出详情失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  async loadComments(concertId: string) {
    // 模拟评论数据
    const mockComments: Comment[] = [
      {
        _id: '1',
        concertId: concertId,
        userId: 'user1',
        userName: '摇滚青年',
        userAvatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83ep0SCS1E1nP9h5iaA3kibia7z2ibibibibibibibib/132',
        content: '痛仰的现场真的太棒了！期待这次巡演！',
        likes: 15,
        isLiked: false,
        createdAt: '2024-11-16T10:30:00Z'
      },
      {
        _id: '2',
        concertId: concertId,
        userId: 'user2',
        userName: '音乐发烧友',
        userAvatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/2ic0S1E1nP9h5iaA3kibia7z2ibibibibibibibibib/132',
        content: '西安音乐厅的音响效果很不错，期待这场演出！',
        likes: 8,
        isLiked: true,
        createdAt: '2024-11-15T14:20:00Z'
      },
      {
        _id: '3',
        concertId: concertId,
        userId: 'user3',
        userName: '现场达人',
        userAvatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83ep0SCS1E1nP9h5iaA3kibia7z2ibibibibibibibibib/132',
        content: '已经买了票，坐等开场！',
        likes: 5,
        isLiked: false,
        createdAt: '2024-11-14T16:45:00Z'
      }
    ];

    this.setData({
      comments: mockComments.map(comment => ({
        ...comment,
        timeFormatted: this.formatTime(comment.createdAt)
      }))
    });
  },

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  },

  onFavoriteTap() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      isFavorited: !this.data.isFavorited
    });
    
    wx.showToast({
      title: this.data.isFavorited ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  onShareTap() {
    // 分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onBuyTicketTap() {
    // 购票功能
    wx.showModal({
      title: '购票提示',
      content: '即将跳转到票务平台，请确认演出信息',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      }
    });
  },

  onNavigateTap() {
    // 导航到场地
    const { concert } = this.data;
    if (concert) {
      wx.openLocation({
        latitude: 34.3416, // 西安音乐厅坐标
        longitude: 108.9398,
        name: concert.venue,
        address: concert.city + concert.venue
      });
    }
  },

  onCommentInput(e: any) {
    this.setData({
      commentInput: e.detail.value
    });
  },

  onSubmitComment() {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const content = this.data.commentInput.trim();
    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    // 模拟提交评论
    const newComment: Comment = {
      _id: Date.now().toString(),
      concertId: this.data.concert!._id,
      userId: this.data.userInfo.openId || 'current_user',
      userName: this.data.userInfo.nickName,
      userAvatar: this.data.userInfo.avatarUrl,
      content: content,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString()
    };

    const comments = [newComment, ...this.data.comments];
    this.setData({
      comments: comments.map(comment => ({
        ...comment,
        timeFormatted: this.formatTime(comment.createdAt)
      })),
      commentInput: ''
    });

    wx.showToast({
      title: '评论发布成功',
      icon: 'success'
    });
  },

  onLikeComment(e: any) {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const { id } = e.currentTarget.dataset;
    const comments = this.data.comments.map(comment => {
      if (comment._id === id) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        };
      }
      return comment;
    });

    this.setData({ comments });
  },

  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  onShareAppMessage() {
    const { concert } = this.data;
    if (concert) {
      return {
        title: concert.title,
        path: `/pages/concert-detail/concert-detail?id=${concert._id}`,
        imageUrl: concert.poster
      };
    }
    return {};
  }
});