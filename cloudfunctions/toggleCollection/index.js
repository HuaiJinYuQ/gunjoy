// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { showId, action } = event;
  
  if (!showId || !action) {
    return {
      code: 400,
      message: '参数错误'
    };
  }
  
  if (!['collect', 'cancel'].includes(action)) {
    return {
      code: 400,
      message: '操作类型错误'
    };
  }
  
  const openid = wxContext.OPENID;
  
  try {
    if (action === 'collect') {
      // 收藏操作
      const existingCollection = await db.collection('collections')
        .where({
          userId: openid,
          showId: showId
        })
        .get();
      
      if (existingCollection.data.length > 0) {
        return {
          code: 200,
          message: '已收藏'
        };
      }
      
      // 添加收藏
      await db.collection('collections').add({
        data: {
          userId: openid,
          showId: showId,
          createdAt: new Date()
        }
      });
      
      console.log('收藏成功:', openid, showId);
      
    } else {
      // 取消收藏操作
      const result = await db.collection('collections')
        .where({
          userId: openid,
          showId: showId
        })
        .remove();
      
      if (result.stats.removed === 0) {
        return {
          code: 404,
          message: '收藏记录不存在'
        };
      }
      
      console.log('取消收藏成功:', openid, showId);
    }
    
    return {
      code: 0,
      message: action === 'collect' ? '收藏成功' : '取消收藏成功'
    };
    
  } catch (error) {
    console.error('收藏操作失败:', error);
    
    return {
      code: 500,
      message: '操作失败',
      error: error.message
    };
  }
};