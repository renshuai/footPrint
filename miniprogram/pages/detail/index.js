// miniprogram/pages/detail/index.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    result: null,
    images: [],
    isSelf: false,
    hasChange: false,
    id: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    if (options.id) {
      this.setData({
        id: options.id
      }, _ => {
        this.initData(options.id);
      })
    }
    if (options.isSelf) {
      this.setData({
        isSelf: options.isSelf
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  initData(id) {
    wx.showLoading({
      title: '加载中'
    })
    wx.cloud.callFunction({
      name: 'detail',
      data: {
        id: id
      }
    }).then(res => {
      this.handleData(res);
    }).catch(error => {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败'
      })
    })
  },
  handleData(res) {
    wx.hideLoading();
    const data = res.result.data || {};
    this.setData({
      result: data
    })
    // 判断是否有图片，有的话需要下载图片
    if (data.fileIds && data.fileIds.length) {
      wx.showLoading({
        title: '加载图片中'
      })
      const promises = [];
      data.fileIds.forEach(item => {
        promises.push(wx.cloud.downloadFile({
          fileID: item
        }))
      })
      Promise.all(promises).then(response => {
        wx.hideLoading();
        const images = [];
        if (response.length) {
          response.forEach(item => {
            if (item.tempFilePath) {
              images.push(item.tempFilePath);
            }
          })
          this.setData({
            images: images
          })
        }
      }).catch(error => {
        wx.hideLoading();
        wx.showToast({
          title: '图片加载失败'
        })
      });
    }
  },
  bindTextAreaBlur: function (e) {
    const value = e.detail.value;
    this.setData({
      ['result.content']: value,
      hasChange: true
    })
  },
  upload() {
    const self = this;
    wx.chooseImage({
      success(res) {
        wx.showLoading({
          title: '上传中'
        })
        const tempFilePaths = res.tempFilePaths
        if (tempFilePaths.length) {
          const promises = [];
          tempFilePaths.forEach(item => {
            const cloudPath = item.split('tmp')[1].substring(1);
            promises.push(wx.cloud.uploadFile({
              cloudPath: cloudPath,
              filePath: item
            }));
          })
          Promise.all(promises).then(response => {
            wx.hideLoading();
            wx.showToast({
              title: '上传成功'
            })
            const fileIds = [];
            if (response.length) {
              response.forEach(item => {
                fileIds.push(item.fileID);
              })
              self.setData({
                ['result.fileIds']: [...self.data.result.fileIds, ...fileIds],
                images: [...self.data.images, ...tempFilePaths],
                hasChange: true
              })
            }
          }).catch(error => {
            wx.hideLoading();
            wx.showToast({
              title: '上传失败'
            })
          })
        }
      }
    })
  },
  save() {
    wx.showLoading({
      title: '保存中'
    })
    const result = this.data.result;
    wx.cloud.init({
      env: app.globalData.env
    })
    const db = wx.cloud.database();
    db.collection('places').doc(this.data.id).update({
      data: {
        content: result.content,
        fileIds: result.fileIds
      }
    }).then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        success: _ => {
          wx.navigateBack({
            delta: 1
          })
        }
      })
    }).catch(error => {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败'
      })
    })
  },
  cancel() {
    wx.navigateBack({
      delta: 1
    })
  },
  delete(e) {
    if (!this.data.isSelf) {
      return;
    }
    const currentTarget = e.currentTarget;
    const index = currentTarget.dataset.index;
    wx.showModal({
      title: '删除提示',
      content: '是否删除该张图片',
      success: res => {
        if (res.confirm) {
          // 点击确定按钮
          this.deleteHandler(index);
        }
      }
    })
  },
  deleteHandler(index) {
    wx.showLoading({
      title: '图片删除中'
    })
    wx.cloud.deleteFile({
      fileList: [this.data.result.fileIds[index]]
    }).then(response => {
      wx.hideLoading();
      const fileIds = this.data.result.fileIds;
      const images = this.data.images;
      fileIds.splice(index, 1);
      images.splice(index, 1);
      this.setData({
        ['result.fileIds']: fileIds,
        images: images,
        hasChange: true
      }, _ => {
        wx.showToast({
          title: '删除成功'
        })
      })
    }).then(error => {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败'
      })
    })
  },
})