const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const type = event.type
  switch (type) {
    case 'getConfigs':
      return await getConfigs(event)
    case 'getConfigByType':
      return await getConfigByType(event)
    case 'initConfig':
      return await initConfig(event)
    default:
      return { code: -1, message: '未知操作类型' }
  }
}

async function getConfigs(event) {
  try {
    const types = Array.isArray(event.types) && event.types.length ? event.types : ['cities', 'genders', 'zodiac_ranges', 'music_tags']
    const out = {}
    const missing = []
    for (const t of types) {
      const r = await db.collection('sys_config').where({ type: t }).orderBy('updatedAt', 'desc').limit(1).get()
      const val = r.data.length ? r.data[0].data : null
      out[t] = val
      if (val == null) missing.push(t)
    }
    if (missing.length) {
      await initConfig({ types: missing, onlyMissing: true })
      // re-fetch missing
      for (const t of missing) {
        const r2 = await db.collection('sys_config').where({ type: t }).orderBy('updatedAt', 'desc').limit(1).get()
        out[t] = r2.data.length ? r2.data[0].data : null
      }
    }
    return { code: 0, data: out, message: 'ok' }
  } catch (error) {
    return { code: -1, message: error.message }
  }
}

async function getConfigByType(event) {
  try {
    const t = event.typeName || event.configType || event.config || event.key || event.type
    if (!t || t === 'getConfigByType') {
      return { code: -1, message: '缺少type' }
    }
    const r = await db.collection('sys_config').where({ type: t }).orderBy('updatedAt', 'desc').limit(1).get()
    if (!r.data.length) {
      await initConfig({ types: [t], onlyMissing: true })
      const r2 = await db.collection('sys_config').where({ type: t }).orderBy('updatedAt', 'desc').limit(1).get()
      if (!r2.data.length) {
        return { code: -1, data: null, message: '未找到配置' }
      }
      return { code: 0, data: r2.data[0].data, message: 'ok' }
    }
    return { code: 0, data: r.data[0].data, message: 'ok' }
  } catch (error) {
    return { code: -1, message: error.message }
  }
}

async function initConfig(event) {
  try {
    const now = new Date()
    const defaults = {
      cities: [
        '北京','上海','广州','深圳','杭州','成都','重庆','西安','武汉','南京',
        '苏州','天津','郑州','长沙','宁波','青岛','合肥','厦门','福州','昆明',
        '大连','济南','沈阳','无锡','佛山','东莞','石家庄','南宁','南昌','哈尔滨',
        '贵阳','太原','呼和浩特','兰州','海口','乌鲁木齐'
      ],
      genders: [
        { value: 0, label: '保密' },
        { value: 1, label: '男' },
        { value: 2, label: '女' }
      ],
      zodiac_ranges: [
        { name: '摩羯座', start: { m: 12, d: 22 }, end: { m: 1, d: 19 } },
        { name: '水瓶座', start: { m: 1, d: 20 }, end: { m: 2, d: 18 } },
        { name: '双鱼座', start: { m: 2, d: 19 }, end: { m: 3, d: 20 } },
        { name: '牡羊座', start: { m: 3, d: 21 }, end: { m: 4, d: 19 } },
        { name: '金牛座', start: { m: 4, d: 20 }, end: { m: 5, d: 20 } },
        { name: '双子座', start: { m: 5, d: 21 }, end: { m: 6, d: 21 } },
        { name: '巨蟹座', start: { m: 6, d: 22 }, end: { m: 7, d: 22 } },
        { name: '狮子座', start: { m: 7, d: 23 }, end: { m: 8, d: 22 } },
        { name: '处女座', start: { m: 8, d: 23 }, end: { m: 9, d: 22 } },
        { name: '天秤座', start: { m: 9, d: 23 }, end: { m: 10, d: 23 } },
        { name: '天蝎座', start: { m: 10, d: 24 }, end: { m: 11, d: 22 } },
        { name: '射手座', start: { m: 11, d: 23 }, end: { m: 12, d: 21 } }
      ],
      music_tags: [
        '摇滚','朋克','金属','独立','民谣摇滚','电子摇滚','后摇','硬核','新金属',
        '黑金属','死核','重金属','蓝调摇滚','英伦摇滚','迷幻','Shoegaze','Grunge',
        'Garage','Math Rock','Emo','Post-Punk','Synth Rock','Industrial','Alternative',
        'Folk Rock','Progressive Rock','Dream Pop','Noise Rock'
      ]
    }
    const payload = event && event.payload ? event.payload : defaults
    const types = (event && Array.isArray(event.types) && event.types.length) ? event.types : Object.keys(payload)
    const results = []
    for (const t of types) {
      const r = await db.collection('sys_config').where({ type: t }).orderBy('updatedAt', 'desc').limit(1).get()
      if (r.data.length) {
        if (event && event.onlyMissing) {
          results.push({ type: t, action: 'skip', id: r.data[0]._id })
        } else {
          const id = r.data[0]._id
          await db.collection('sys_config').doc(id).update({ data: { type: t, data: payload[t], version: 'v1', updatedAt: now } })
          results.push({ type: t, action: 'update', id })
        }
      } else {
        const add = await db.collection('sys_config').add({ data: { type: t, data: payload[t], version: 'v1', updatedAt: now } })
        results.push({ type: t, action: 'add', id: add._id })
      }
    }
    return { code: 0, data: results, message: 'init ok' }
  } catch (error) {
    return { code: -1, message: error.message }
  }
}