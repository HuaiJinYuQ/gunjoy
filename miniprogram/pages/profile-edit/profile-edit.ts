Page({
  data: {
    form: {
      avatarUrl: '',
      nickname: '',
      gender: 0,
      birthday: '',
      city: '',
      signature: '',
      tags: [] as string[]
    },
    allTags: [] as string[],
    cities: [] as string[],
    genders: [] as any[],
    customTagInput: ''
  },

  onLoad() {
    wx.cloud.callFunction({ name: 'user', data: { type: 'userGetProfile' } })
      .then((r: any) => {
        if (r.result && r.result.code === 0) {
          const u = r.result.data
          this.setData({
            form: {
              avatarUrl: u.avatarUrl || u.avatar || '',
              nickname: u.nickname || '',
              gender: u.gender || 0,
              birthday: u.birthday || '',
              city: u.city || '',
              signature: u.signature || '',
              tags: u.tags || []
            }
          })
        }
      })
    this.loadSysConfig()
  },

  onChooseAvatar(e: any) {
    const url = e.detail.avatarUrl
    const form = this.data.form
    form.avatarUrl = url
    this.setData({ form })
  },

  onInput(e: any) {
    const key = e.currentTarget.dataset.key
    const val = e.detail.value
    const form = this.data.form as any
    form[key] = val
    this.setData({ form })
  },

  onGenderSelect(e: any) {
    const value = Number(e.currentTarget.dataset.value)
    const form = this.data.form
    form.gender = value
    this.setData({ form })
  },

  onBirthdayChange(e: any) {
    const form = this.data.form
    form.birthday = e.detail.value
    this.setData({ form })
  },

  onTagToggle(e: any) {
    const idx = Number(e.currentTarget.dataset.index)
    const tag = e.currentTarget.dataset.tag || this.data.allTags[idx]
    const tags = this.data.form.tags || []
    const i = tags.indexOf(tag)
    const next = i > -1 ? [...tags.slice(0, i), ...tags.slice(i + 1)] : [...tags, tag]
    this.setData({ 'form.tags': next })
  },

  onTagRemove(e: any) {
    const tag = e.currentTarget.dataset.tag
    const tags = this.data.form.tags || []
    const i = tags.indexOf(tag)
    if (i > -1) {
      const next = [...tags.slice(0, i), ...tags.slice(i + 1)]
      this.setData({ 'form.tags': next })
    }
  },

  onCustomTagInput(e: any) {
    this.setData({ customTagInput: e.detail.value })
  },

  onCustomTagConfirm(e: any) {
    const raw = (e.detail && e.detail.value) ? e.detail.value : this.data.customTagInput
    const tag = String(raw || '').trim()
    if (!tag) return
    const tags = this.data.form.tags || []
    if (tags.indexOf(tag) > -1) {
      this.setData({ customTagInput: '' })
      return
    }
    const next = [...tags, tag]
    this.setData({ 'form.tags': next, customTagInput: '' })
  },

  onChipLongPress(e: any) {
    const tag = e.currentTarget.dataset.tag
    if (tag) wx.showToast({ title: tag, icon: 'none' })
  },

  onCityPick(e: any) {
    const index = Number(e.detail.value)
    const city = this.data.cities[index]
    const form = this.data.form
    form.city = city
    this.setData({ form })
  },

  onSave() {
    const f = this.data.form
    wx.cloud.callFunction({
      name: 'user',
      data: {
        type: 'userUpdateProfile',
        nickname: f.nickname,
        avatarUrl: f.avatarUrl,
        gender: f.gender,
        birthday: f.birthday,
        city: f.city,
        signature: f.signature,
        tags: f.tags
      }
    }).then((r: any) => {
      if (r.result && r.result.code === 0) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 300)
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' })
      }
    }).catch(() => wx.showToast({ title: '保存失败', icon: 'none' }))
  },

  loadSysConfig() {
    const cached = wx.getStorageSync('sysConfig')
    const now = Date.now()
    if (cached && cached.expireTime && now < cached.expireTime) {
      const data = cached.data || {}
      if (Array.isArray(data.cities)) this.setData({ cities: data.cities })
      if (Array.isArray(data.music_tags)) this.setData({ allTags: data.music_tags })
      if (Array.isArray(data.genders)) this.setData({ genders: data.genders })
      return
    }
    wx.cloud.callFunction({ name: 'config', data: { type: 'getConfigs', types: ['cities', 'music_tags', 'genders'] } })
      .then((r: any) => {
        if (r.result && r.result.code === 0) {
          const data = r.result.data || {}
          if (Array.isArray(data.cities)) this.setData({ cities: data.cities })
          if (Array.isArray(data.music_tags)) this.setData({ allTags: data.music_tags })
          if (Array.isArray(data.genders)) this.setData({ genders: data.genders })
          wx.setStorageSync('sysConfig', { data, expireTime: now + 24 * 60 * 60 * 1000 })
        }
      })
      .catch(() => {})
  }
})