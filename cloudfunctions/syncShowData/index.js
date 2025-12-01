// 云函数入口文件
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 模拟数据源 - 实际项目中需要接入真实的API
const MOCK_DATA_SOURCES = {
  damai: {
    name: '大麦网',
    baseUrl: 'https://api.damai.cn',
    apiKey: '' // 需要配置真实的API密钥
  },
  showstart: {
    name: '秀动',
    baseUrl: 'https://api.showstart.com',
    apiKey: '' // 需要配置真实的API密钥
  }
};

// 演出类型映射
const CATEGORY_MAP = {
  '演唱会': 'concert',
  '音乐会': 'music',
  '话剧': 'drama',
  '歌剧': 'opera',
  '舞蹈': 'dance',
  '展览': 'exhibition',
  '其他': 'other'
};

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    console.log('开始同步演出数据...');
    
    // 记录同步日志
    await logSyncStart();
    
    // 获取所有数据源的数据
    const allShows = [];
    
    // 模拟数据 - 实际项目中需要从真实API获取
    const mockShows = generateMockShows();
    allShows.push(...mockShows);
    
    // 数据处理和去重
    const processedShows = await processShowsData(allShows);
    
    // 批量写入数据库
    const result = await batchInsertShows(processedShows);
    
    // 记录同步完成
    await logSyncComplete(result);
    
    return {
      code: 0,
      message: '数据同步成功',
      data: {
        total: result.total,
        inserted: result.inserted,
        updated: result.updated
      }
    };
    
  } catch (error) {
    console.error('数据同步失败:', error);
    
    // 记录错误日志
    await logSyncError(error);
    
    return {
      code: 500,
      message: '数据同步失败',
      error: error.message
    };
  }
};

// 生成模拟数据
function generateMockShows() {
  const shows = [];
  const categories = ['演唱会', '音乐会', '话剧', '展览', '舞蹈'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京'];
  const venues = ['国家大剧院', '上海音乐厅', '广州大剧院', '深圳音乐厅', '杭州剧院'];
  
  for (let i = 1; i <= 20; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const venue = venues[Math.floor(Math.random() * venues.length)];
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 90));
    
    shows.push({
      title: `${category}演出 ${i}`,
      description: `这是一场精彩的${category}演出，不容错过！`,
      poster: `https://example.com/poster${i}.jpg`,
      showDate: date,
      venue: venue,
      city: city,
      category: category,
      priceRange: `${Math.floor(Math.random() * 500 + 100)}-${Math.floor(Math.random() * 1000 + 500)}`,
      bookingUrl: `https://example.com/booking/${i}`,
      sourcePlatform: 'damai',
      sourceId: `damai_${i}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  return shows;
}

// 处理演出数据
async function processShowsData(shows) {
  const processedShows = [];
  
  for (const show of shows) {
    try {
      // 数据验证
      if (!show.title || !show.showDate) {
        console.warn('跳过无效数据:', show);
        continue;
      }
      
      // 数据标准化
      const processedShow = {
        ...show,
        title: show.title.trim(),
        description: show.description ? show.description.trim() : '',
        category: CATEGORY_MAP[show.category] || 'other',
        city: show.city.trim(),
        venue: show.venue.trim(),
        priceRange: normalizePriceRange(show.priceRange),
        showDate: new Date(show.showDate),
        updatedAt: new Date()
      };
      
      processedShows.push(processedShow);
      
    } catch (error) {
      console.error('处理演出数据失败:', error);
    }
  }
  
  return processedShows;
}

// 标准化价格范围
function normalizePriceRange(priceRange) {
  if (!priceRange) return '价格待定';
  
  // 处理不同格式的价格
  const priceStr = String(priceRange);
  const prices = priceStr.match(/\d+/g);
  
  if (!prices || prices.length === 0) return '价格待定';
  
  if (prices.length === 1) {
    return `¥${prices[0]}`;
  }
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  return `¥${minPrice}-${maxPrice}`;
}

// 批量插入演出数据
async function batchInsertShows(shows) {
  const batch = db.batch();
  let inserted = 0;
  let updated = 0;
  
  for (const show of shows) {
    try {
      // 检查是否已存在
      const existingShow = await db.collection('shows')
        .where({
          sourcePlatform: show.sourcePlatform,
          sourceId: show.sourceId
        })
        .get();
      
      if (existingShow.data.length > 0) {
        // 更新现有数据
        const docId = existingShow.data[0]._id;
        batch.update({
          collection: 'shows',
          doc: docId,
          data: show
        });
        updated++;
      } else {
        // 插入新数据
        batch.add({
          collection: 'shows',
          data: show
        });
        inserted++;
      }
      
    } catch (error) {
      console.error('处理演出数据失败:', error);
    }
  }
  
  // 执行批量操作
  if (inserted > 0 || updated > 0) {
    await batch.commit();
  }
  
  return {
    total: shows.length,
    inserted,
    updated
  };
}

// 记录同步开始日志
async function logSyncStart() {
  try {
    await db.collection('system_logs').add({
      data: {
        level: 'info',
        message: '开始同步演出数据',
        metadata: {
          timestamp: new Date(),
          function: 'syncShowData'
        },
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('记录同步日志失败:', error);
  }
}

// 记录同步完成日志
async function logSyncComplete(result) {
  try {
    await db.collection('system_logs').add({
      data: {
        level: 'info',
        message: '演出数据同步完成',
        metadata: {
          result,
          timestamp: new Date(),
          function: 'syncShowData'
        },
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('记录同步完成日志失败:', error);
  }
}

// 记录同步错误日志
async function logSyncError(error) {
  try {
    await db.collection('system_logs').add({
      data: {
        level: 'error',
        message: '演出数据同步失败',
        metadata: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date(),
          function: 'syncShowData'
        },
        createdAt: new Date()
      }
    });
  } catch (logError) {
    console.error('记录错误日志失败:', logError);
  }
}
