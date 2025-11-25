const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
let zodiacRangesCache = null

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  switch (event.type) {
    case 'userLogin':
      return await userLogin(event, wxContext)
    case 'userGetProfile':
      return await userGetProfile(event, wxContext)
    case 'userUpdateProfile':
      return await userUpdateProfile(event, wxContext)
    case 'userGetProfileById':
      return await userGetProfileById(event, wxContext)
    default:
      return { code: -1, message: '未知操作类型' }
  }
}

async function userLogin(event, wxContext) {
  try {
    const { userInfo, loginCode } = event
    let openid = wxContext.OPENID
    let unionid = wxContext.UNIONID || null

    if (loginCode) {
      try {
        const sess = await cloud.openapi.auth.code2Session({
          js_code: loginCode,
          grant_type: 'authorization_code'
        })
        openid = sess.openid || openid
        unionid = sess.unionid || unionid || null
      } catch (e) {}
    }
    if (!openid) {
      return { code: -1, message: '缺少openid' }
    }
    const userResult = await db.collection('users').where({ openid }).get()
    let user
    if (userResult.data.length === 0) {
      const newUser = { openid, unionid, createdAt: new Date(), updatedAt: new Date() }
      const addResult = await db.collection('users').add({ data: newUser })
      user = { ...newUser, _id: addResult._id }
    } else {
      user = userResult.data[0]
    }
    return { code: 0, data: user, message: '登录成功' }
  } catch (error) {
    return { code: -1, message: error.message }
  }
}

async function userGetProfile(event, wxContext) {
  try {
    const openid = wxContext.OPENID
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const user = userResult.data[0]
    const age = calcAge(user.birthday)
    const zodiac = await getZodiacName(user.birthday)
    return { code: 0, data: { ...user, age, zodiac }, message: '获取成功' }
  } catch (error) {
    return { code: -1, message: error.message }
  }
}

async function userUpdateProfile(event, wxContext) {
  try {
    const openid = wxContext.OPENID
    const fields = {}
    const allow = ['nickname','avatarUrl','avatar','gender','birthday','city','province','signature','tags']
    allow.forEach(k => { if (event[k] !== undefined) fields[k] = event[k] })
    if (Object.keys(fields).length === 0) {
      return { code: -1, message: '无可更新字段' }
    }
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const user = userResult.data[0]
    await db.collection('users').doc(user._id).update({ data: { ...fields, updatedAt: new Date() } })
    const latest = await db.collection('users').doc(user._id).get()
    const age = calcAge(latest.data.birthday)
    const zodiac = await getZodiacName(latest.data.birthday)
    return { code: 0, data: { ...latest.data, age, zodiac }, message: '更新成功' }
  } catch (error) {
    return { code: -1, message: error.message }
  }
}

async function userGetProfileById(event, wxContext) {
  try {
    const { id } = event
    if (!id) {
      return { code: -1, message: '缺少id' }
    }
    const latest = await db.collection('users').doc(id).get()
    if (!latest.data) {
      return { code: -1, message: '用户不存在' }
    }
    const age = calcAge(latest.data.birthday)
    const zodiac = calcZodiac(latest.data.birthday)
    return { code: 0, data: { ...latest.data, age, zodiac }, message: '获取成功' }
  } catch (error) {
    return { code: -1, message: error.message }
  }
}

function calcAge(birthday) {
  if (!birthday) return null
  const b = new Date(birthday)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

function calcZodiacFallback(birthday) {
  if (!birthday) return null
  const b = new Date(birthday)
  const m = b.getMonth() + 1
  const d = b.getDate()
  const ranges = [
    ['摩羯座', 12, 22, 1, 19], ['水瓶座', 1, 20, 2, 18], ['双鱼座', 2, 19, 3, 20],
    ['牡羊座', 3, 21, 4, 19], ['金牛座', 4, 20, 5, 20], ['双子座', 5, 21, 6, 21],
    ['巨蟹座', 6, 22, 7, 22], ['狮子座', 7, 23, 8, 22], ['处女座', 8, 23, 9, 22],
    ['天秤座', 9, 23, 10, 23], ['天蝎座', 10, 24, 11, 22], ['射手座', 11, 23, 12, 21]
  ]
  for (const [name, sm, sd, em, ed] of ranges) {
    if ((m === sm && d >= sd) || (m === em && d <= ed)) return name
  }
  return null
}

async function getZodiacName(birthday) {
  if (!birthday) return null
  if (!zodiacRangesCache) {
    const r = await db.collection('sys_config').where({ type: 'zodiac_ranges' }).orderBy('updatedAt', 'desc').limit(1).get()
    zodiacRangesCache = r.data.length ? r.data[0].data : null
  }
  if (Array.isArray(zodiacRangesCache) && zodiacRangesCache.length) {
    const b = new Date(birthday)
    const m = b.getMonth() + 1
    const d = b.getDate()
    for (const item of zodiacRangesCache) {
      const sm = item.start && item.start.m
      const sd = item.start && item.start.d
      const em = item.end && item.end.m
      const ed = item.end && item.end.d
      if (sm && sd && em && ed) {
        if ((m === sm && d >= sd) || (m === em && d <= ed)) return item.name
      }
    }
    return null
  }
  return calcZodiacFallback(birthday)
}