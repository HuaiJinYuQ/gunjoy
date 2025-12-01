// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const {
    page = 1,
    pageSize = 20,
    keyword = '',
    category = '',
    city = '',
    dateRange = null,
    priceRange = null,
    sortBy = 'showDate',
    sortOrder = 'asc'
  } = event;
  
  try {
    // 构建查询条件
    let where = {};
    
    // 关键词搜索
    if (keyword) {
      where.title = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }
    
    // 类型筛选
    if (category) {
      where.category = category;
    }
    
    // 城市筛选
    if (city) {
      where.city = city;
    }
    
    // 日期范围筛选
    if (dateRange && dateRange.start && dateRange.end) {
      where.showDate = _.and(
        _.gte(new Date(dateRange.start)),
        _.lte(new Date(dateRange.end))
      );
    }
    
    // 价格范围筛选（这里简化处理，实际需要更复杂的逻辑）
    if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
      // 价格筛选逻辑需要根据实际数据格式调整
      where.priceRange = db.RegExp({
        regexp: `¥[${priceRange.min}-${priceRange.max}]`,
        options: 'i'
      });
    }
    
    // 计算总数
    const countResult = await db.collection('shows')
      .where(where)
      .count();
    
    const total = countResult.total;
    
    // 构建排序
    let orderBy = {};
    if (sortBy === 'showDate') {
      orderBy.showDate = sortOrder === 'desc' ? 'desc' : 'asc';
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder === 'desc' ? 'desc' : 'asc';
    }
    
    // 查询数据
    const result = await db.collection('shows')
      .where(where)
      .orderBy(orderBy)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    // 处理返回数据
    const list = result.data.map(show => ({
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
      createdAt: show.createdAt,
      updatedAt: show.updatedAt
    }));
    
    return {
      code: 0,
      message: 'success',
      data: {
        list,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      }
    };
    
  } catch (error) {
    console.error('获取演出列表失败:', error);
    
    return {
      code: 500,
      message: '获取演出列表失败',
      error: error.message
    };
  }
};