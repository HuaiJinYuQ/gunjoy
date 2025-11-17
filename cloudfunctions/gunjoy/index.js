// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  switch (event.type) {
    case 'getConcerts':
      return await getConcerts(event, wxContext)
    case 'getConcertDetail':
      return await getConcertDetail(event, wxContext)
    case 'userLogin':
      return await userLogin(event, wxContext)
    case 'publishComment':
      return await publishComment(event, wxContext)
    case 'favoriteConcert':
      return await favoriteConcert(event, wxContext)
    case 'getUserFavorites':
      return await getUserFavorites(event, wxContext)
    default:
      return {
        code: -1,
        message: '未知操作类型'
      }
  }
}

// 获取演出列表
async function getConcerts(event, wxContext) {
  try {
    const { page = 1, pageSize = 10, city, genre, priceRange } = event
    
    let where = {}
    if (city && city !== '全部城市') {
      where.city = city
    }
    if (genre && genre !== '全部风格') {
      where.genres = db.command.in([genre])
    }
    if (priceRange && priceRange !== '全部价格') {
      // 价格范围筛选逻辑
      const [minPrice, maxPrice] = parsePriceRange(priceRange)
      where.price = db.command.gte(minPrice).and(db.command.lte(maxPrice))
    }
    
    const result = await db.collection('concerts')
      .where(where)
      .orderBy('date', 'asc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    return {
      code: 0,
      data: result.data,
      message: '获取成功'
    }
  } catch (error) {
    return {
      code: -1,
      message: error.message
    }
  }
}

// 获取演出详情
async function getConcertDetail(event, wxContext) {
  try {
    const { id } = event
    
    const result = await db.collection('concerts')
      .doc(id)
      .get()
    
    if (!result.data) {
      return {
        code: -1,
        message: '演出不存在'
      }
    }
    
    return {
      code: 0,
      data: result.data,
      message: '获取成功'
    }
  } catch (error) {
    return {
      code: -1,
      message: error.message
    }
  }
}

// 用户登录
async function userLogin(event, wxContext) {
  try {
    const { userInfo } = event
    const openid = wxContext.OPENID
    
    // 检查用户是否已存在
    const userResult = await db.collection('users')
      .where({
        openid: openid
      })
      .get()
    
    let user
    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const newUser = {
        openid: openid,
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender,
        city: userInfo.city,
        province: userInfo.province,
        country: userInfo.country,
        preferences: {
          genres: [],
          cities: [],
          priceRange: [0, 1000]
        },
        level: 1,
        badges: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const addResult = await db.collection('users').add({
        data: newUser
      })
      
      user = {
        ...newUser,
        _id: addResult._id
      }
    } else {
      // 老用户，更新信息
      user = userResult.data[0]
      await db.collection('users')
        .doc(user._id)
        .update({
          data: {
            nickname: userInfo.nickName,
            avatar: userInfo.avatarUrl,
            updatedAt: new Date()
          }
        })
    }
    
    return {
      code: 0,
      data: user,
      message: '登录成功'
    }
  } catch (error) {
    return {
      code: -1,
      message: error.message
    }
  }
}

// 发布评论
async function publishComment(event, wxContext) {
  try {
    const { concertId, content } = event
    const openid = wxContext.OPENID
    
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 创建评论
    const comment = {
      concertId: concertId,
      userId: user._id,
      userName: user.nickname,
      userAvatar: user.avatar,
      content: content,
      likes: 0,
      isLiked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.collection('comments').add({
      data: comment
    })
    
    return {
      code: 0,
      message: '评论发布成功'
    }
  } catch (error) {
    return {
      code: -1,
      message: error.message
    }
  }
}

// 收藏演出
async function favoriteConcert(event, wxContext) {
  try {
    const { concertId, action } = event // action: 'add' or 'remove'
    const openid = wxContext.OPENID
    
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    if (action === 'add') {
      // 添加收藏
      const favorite = {
        userId: user._id,
        concertId: concertId,
        createdAt: new Date()
      }
      
      await db.collection('favorites').add({
        data: favorite
      })
    } else {
      // 移除收藏
      await db.collection('favorites')
        .where({
          userId: user._id,
          concertId: concertId
        })
        .remove()
    }
    
    return {
      code: 0,
      message: action === 'add' ? '收藏成功' : '取消收藏成功'
    }
  } catch (error) {
    return {
      code: -1,
      message: error.message
    }
  }
}

// 获取用户收藏
async function getUserFavorites(event, wxContext) {
  try {
    const openid = wxContext.OPENID
    
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ openid: openid })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 获取收藏列表
    const favoritesResult = await db.collection('favorites')
      .where({ userId: user._id })
      .orderBy('createdAt', 'desc')
      .get()
    
    // 获取演出详情
    const concertIds = favoritesResult.data.map(item => item.concertId)
    const concertsResult = await db.collection('concerts')
      .where({
        _id: db.command.in(concertIds)
      })
      .get()
    
    return {
      code: 0,
      data: concertsResult.data,
      message: '获取成功'
    }
  } catch (error) {
    return {
      code: -1,
      message: error.message
    }
  }
}

// 解析价格范围
function parsePriceRange(priceRange) {
  switch (priceRange) {
    case '0-100':
      return [0, 100]
    case '100-300':
      return [100, 300]
    case '300-500':
      return [300, 500]
    case '500+':
      return [500, 999999]
    default:
      return [0, 999999]
  }
}