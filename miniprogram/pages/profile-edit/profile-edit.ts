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
    allTags: ['摇滚','朋克','金属','独立','民谣摇滚','电子摇滚','后摇','布鲁斯']
  },

  onLoad() {
    wx.cloud.callFunction({ name: 'gunjoy', data: { type: 'userGetProfile' } })
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
  },

  onChangeAvatar() {
    wx.chooseImage({ count: 1 }).then((res: any) => {
      const path = res.tempFilePaths[0]
      this.setData({ 'data.form.avatarUrl': path })
    })
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
    const tag = this.data.allTags[idx]
    const form = this.data.form
    const i = form.tags.indexOf(tag)
    if (i > -1) form.tags.splice(i, 1)
    else form.tags.push(tag)
    this.setData({ form })
  },

  onSave() {
    const f = this.data.form
    wx.cloud.callFunction({
      name: 'gunjoy',
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
  }
})