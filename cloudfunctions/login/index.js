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
  
  try {
    const openid = wxContext.OPENID;
    
    // 检查用户是否已存在
    const userResult = await db.collection('users')
      .where({
        openid: openid
      })
      .get();
    
    let user;
    
    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      user = {
        openid: openid,
        nickname: '',
        avatarUrl: '',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      await db.collection('users').add({
        data: user
      });
      
      console.log('新用户创建成功:', openid);
    } else {
      // 老用户，更新最后登录时间
      user = userResult.data[0];
      
      await db.collection('users')
        .doc(user._id)
        .update({
          data: {
            lastLoginAt: new Date()
          }
        });
      
      console.log('用户登录成功:', openid);
    }
    
    return {
      code: 0,
      message: '登录成功',
      data: {
        openid: openid,
        userInfo: user
      }
    };
    
  } catch (error) {
    console.error('登录失败:', error);
    
    return {
      code: 500,
      message: '登录失败',
      error: error.message
    };
  }
};