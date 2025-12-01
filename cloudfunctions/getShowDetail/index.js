// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const { id } = event;
  
  if (!id) {
    return {
      code: 400,
      message: '演出ID不能为空'
    };
  }
  
  try {
    // 查询演出详情
    const result = await db.collection('shows')
      .doc(id)
      .get();
    
    if (!result.data) {
      return {
        code: 404,
        message: '演出不存在'
      };
    }
    
    const show = result.data;
    
    // 获取用户收藏状态（如果用户已登录）
    const wxContext = cloud.getWXContext();
    let isCollected = false;
    
    if (wxContext.OPENID) {
      const collectionResult = await db.collection('collections')
        .where({
          userId: wxContext.OPENID,
          showId: id
        })
        .get();
      
      isCollected = collectionResult.data.length > 0;
    }
    
    // 格式化返回数据
    const showDetail = {
      id: show._id,
      title: show.title,
      description: show.description,
      poster: show.poster,
      showDate: show.showDate,
      venue: show.venue,
      city: show.city,
      category: show.category,
      priceRange: show.priceRange,
      bookingUrl: show.bookingUrl,
      sourcePlatform: show.sourcePlatform,
      sourceId: show.sourceId,
      isCollected: isCollected,
      createdAt: show.createdAt,
      updatedAt: show.updatedAt
    };
    
    return {
      code: 0,
      message: 'success',
      data: showDetail
    };
    
  } catch (error) {
    console.error('获取演出详情失败:', error);
    
    return {
      code: 500,
      message: '获取演出详情失败',
      error: error.message
    };
  }
};