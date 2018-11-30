// miniprogram/pages/form/index.js
const utils = require('../../utils/utils.js')
const app = getApp();
const Bmob = require('../../utils/Bmob-1.6.6.min.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '',
    images: [],
    fileIds: [],
    location: null,
    date: null,
    time: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.chooseLocation();
    this.initTime();
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
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        console.log(res);
        this.setData({
          location: res
        })
      }
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
                fileIds: [...self.data.fileIds, ...fileIds],
                images: [...self.data.images, ...tempFilePaths]
              })
            }
          })
        }
      }
    })
  },
  initTime() {
    const date = new Date();
    const timeObj = utils.formatTime(date);
    this.setData({
      date: timeObj.date,
      time: timeObj.time,
    })
  },
  submit(e) {
    // 处理数据
    let location = this.data.location;
    const address = location.address;
    const provinceRgx = /(北京市|天津市|上海市|重庆市|河北省|河南省|云南省|辽宁省|黑龙江省|湖南省|安徽省|山东省|新疆维吾尔自治区|江苏省|浙江省|江西省|湖北省|广西壮族自治区|甘肃省|山西省|内蒙古自治区|陕西省|吉林省|福建省|贵州省|广东省|青海省|西藏自治区|四川省|宁夏回族自治区|海南省|台湾省|香港特别行政区|澳门特别行政区)/g;
    const provinceArr = address.match(provinceRgx);
    if (provinceArr && provinceArr.length) {
      let province = provinceArr[0];
      province = province.replace(/[省市(壮族自治区)(维吾尔自治区)(自治区)(回族自治区)(特别行政区)]/g, '');
      location.province = province;
    }
    location['_openid'] = app.globalData.openid;
    const now = new Date();
    location.time = utils.formatTime(now).complete;
    location.timestamp = Date.parse(now);
    location.content = this.data.content;
    location.fileIds = this.data.fileIds;
    this.addPrint(location);
    this.pullMessage(e);
  },
  bindTextAreaBlur: function (e) {
    const value = e.detail.value;
    this.setData({
      content: value
    })
  },
  addPrint(location) {
    wx.cloud.callFunction({
      name: 'add',
      data: {
        data: location
      }
    }).then(res => {
      wx.navigateBack({
        delta: 1
      })
    })
  },
  pullMessage(e) {
    const formId = e.detail.formId;
    if (formId) {
      let modelData = {
        "touser": app.globalData.openid,
        "template_id": "3cBuw6FOdjZvLXux0BI4TKkz7PVAS-UZ-HOAq5hYFbc",
        "page": "/pages/index/index",
        "form_id": formId,
        "data": {
          "keyword1": {
            "value": "每日点亮足迹吧",
            "color": "#173177"
          },
          "keyword2": {
            "value": "每天点亮足迹，并分享给好友吧"
          },
          "keyword3": {
            "value": "当前签到次数为1次，加油哦"
          }
        }
        , "emphasis_keyword": ""
      }


      Bmob.sendWeAppMessage(modelData).then(function (response) {
        console.log(response);
      }).catch(function (error) {
        console.log(error);
      });
    }
  }
})