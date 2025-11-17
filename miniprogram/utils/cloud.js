// 云开发环境配置
// 需要在微信公众平台开通云开发功能

// 云开发初始化
wx.cloud.init({
  env: 'gunjoy-env-1g2h3j4k5l6m7n8o9p0q', // 替换为你的云开发环境ID
  traceUser: true,
});

// 数据库集合定义
const db = wx.cloud.database();

// 演出信息集合
const concertsCollection = db.collection('concerts');

// 用户集合
const usersCollection = db.collection('users');

// 评论集合
const commentsCollection = db.collection('comments');

// 收藏集合
const favoritesCollection = db.collection('favorites');

// 云函数定义
const cloudFunctions = {
  // 获取演出列表
  getConcerts: 'getConcerts',
  // 获取演出详情
  getConcertDetail: 'getConcertDetail',
  // 用户登录
  userLogin: 'userLogin',
  // 发布评论
  publishComment: 'publishComment',
  // 收藏演出
  favoriteConcert: 'favoriteConcert',
  // 获取用户收藏
  getUserFavorites: 'getUserFavorites'
};

export {
  concertsCollection,
  usersCollection,
  commentsCollection,
  favoritesCollection,
  cloudFunctions
};