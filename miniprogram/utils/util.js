// 工具函数
const formatDate = (dateStr) => {
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
};

const formatPrice = (priceRange) => {
  if (!priceRange) return '价格待定';
  return priceRange;
};

const getCategoryColor = (category) => {
  const categoryMap = {
    'concert': '#FF6B35',
    'music': '#4ECDC4',
    'drama': '#45B7D1',
    'exhibition': '#96CEB4',
    'dance': '#FFEAA7',
    'other': '#DDA0DD'
  };
  return categoryMap[category] || '#DDA0DD';
};

const getCategoryName = (category) => {
  const categoryMap = {
    'concert': '演唱会',
    'music': '音乐会',
    'drama': '话剧',
    'exhibition': '展览',
    'dance': '舞蹈',
    'other': '其他'
  };
  return categoryMap[category] || '其他';
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title: title,
    icon: icon,
    duration: duration
  });
};

const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  });
};

const hideLoading = () => {
  wx.hideLoading();
};

const showModal = (title, content, options = {}) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: title,
      content: content,
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定',
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
};

const navigateToDetail = (showId) => {
  wx.navigateTo({
    url: `/pages/detail/detail?id=${showId}`
  });
};

const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${distance}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

module.exports = {
  formatDate,
  formatPrice,
  getCategoryColor,
  getCategoryName,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  navigateToDetail,
  formatDistance,
  validatePhone,
  validateEmail,
  generateUUID
};