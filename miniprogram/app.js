//app.js
const Bmob = require('./utils/Bmob-1.6.6.min.js');

App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    this.getUserOpenId();

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              console.log(res.userInfo);

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })

    // 初始化Bomb
    Bmob.initialize("fad02adad7b8ab7a29e8dc2793543534", "c87b8a81d90f81f14503ffe3b683b034");

  },
  globalData: {
    userInfo: null,
    openid: '',
    env: 'footprint-46e6ce',
    limit: 20,
    addInterval: 20 * 1000 //添加的1分钟限制
  },
  getUserOpenId() {
    wx.cloud.init({
      env: this.globalData.env
    });
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      if (res.result && res.result.openid) {
        this.globalData.openid = res.result.openid
      }
    })
  }
})