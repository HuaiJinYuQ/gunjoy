interface ShowDetail {
  id: string;
  title: string;
  description: string;
  poster: string;
  showDate: string;
  venue: string;
  city: string;
  category: string;
  priceRange: string;
  bookingUrl?: string;
  sourcePlatform?: string;
  sourceId?: string;
  isCollected?: boolean;
}

Page({
  data: {
    loading: true,
    show: null as ShowDetail | null,
    isCollected: false,
    hasError: false,
    errorMessage: ''
  },

  onLoad(options: any) {
    const { id } = options || {};
    if (!id) {
      this.setData({ loading: false, hasError: true, errorMessage: '缺少演出ID' });
      return;
    }
    this.fetchDetail(id);
  },

  async fetchDetail(id: string) {
    this.setData({ loading: true, hasError: false, errorMessage: '' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getShowDetail',
        data: { id }
      });
      const { result } = res as any;
      if (!result || result.code !== 0) {
        const msg = (result && result.message) || '获取演出详情失败';
        this.setData({ hasError: true, errorMessage: msg });
        wx.showToast({ title: msg, icon: 'none' });
      } else {
        const show: ShowDetail = result.data;
        this.setData({ show, isCollected: !!show.isCollected });
        wx.setNavigationBarTitle({ title: show.title });
      }
    } catch (err) {
      console.error('getShowDetail 调用失败', err);
      this.setData({ hasError: true, errorMessage: '网络错误，请稍后重试' });
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  formatDate(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  },

  async onToggleCollection() {
    const { show, isCollected } = this.data as any;
    if (!show) return;
    try {
      wx.showLoading({ title: isCollected ? '取消收藏...' : '收藏中...' });
      const action = isCollected ? 'cancel' : 'collect';
      const res = await wx.cloud.callFunction({
        name: 'toggleCollection',
        data: { showId: show.id, action }
      });
      const { result } = res as any;
      if (result && result.code === 0) {
        this.setData({ isCollected: !isCollected });
        wx.showToast({ title: isCollected ? '已取消收藏' : '已收藏', icon: 'success' });
      } else {
        wx.showToast({ title: (result && result.message) || '操作失败', icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onBuy() {
    const { show } = this.data as any;
    if (!show || !show.bookingUrl) {
      wx.showToast({ title: '暂无购票链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: show.bookingUrl,
      success: () => {
        wx.showModal({
          title: '购票链接已复制',
          content: '已复制到剪贴板，请在浏览器打开完成购票。',
          showCancel: false
        });
      }
    });
  },

  onOpenMap() {
    const { show } = this.data as any;
    if (!show) return;
    wx.showToast({ title: '暂未提供坐标', icon: 'none' });
  },

  onShareAppMessage() {
    const { show } = this.data as any;
    if (!show) return {};
    return {
      title: show.title,
      path: `/pages/detail/detail?id=${show.id}`,
      imageUrl: show.poster
    };
  }
});
