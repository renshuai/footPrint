import * as echarts from '../../ec-canvas/echarts';
import geoJson from './chinaData.js';
import utils from '../../utils/utils';
const Bmob = require('../../utils/Bmob-1.6.6.min.js');

const app = getApp();

const option = {
  title: {
    text: '',
    textStyle: {
      color: '#fff',
      fontSize: 16
    },
    left: 'center',
    top: 'bottom'

  },
  tooltip: {
    trigger: 'item',
    formatter: '{b}{c}'
  },
  visualMap: {
    show: false,
    min: 0,
    max: 5,
    left: 'left',
    top: 'bottom',
    text: ['高', '低'], // 文本，默认为数值文本
    calculable: true,
    inRange: {
      color: ['#009999', '#003333']
    }
  },
  toolbox: {
    show: false,
    orient: 'vertical',
    left: 'right',
    top: 'center',
    feature: {
      dataView: { readOnly: false },
      restore: {},
      saveAsImage: {}
    }
  },
  series: [{
    type: 'map',
    mapType: 'china',
    label: {
      normal: {
        show: false
      },
      emphasis: {
        textStyle: {
          color: '#fff'
        }
      }
    },
    itemStyle: {
      normal: {
        // borderColor: '#389BB7',
        borderColor: '#fff',
        areaColor: '#fff',
      },
      emphasis: {
        areaColor: '#006666',
        borderWidth: 0
      }
    },
    animation: false,
    data: [{ name: '北京', value: 0 }, { name: '天津', value: 0 },
      { name: '上海', value: 0 }, { name: '重庆', value: 0 },
      { name: '河北', value: 0 }, { name: '河南', value: 0 },
      { name: '云南', value: 0 }, { name: '辽宁', value: 0 },
      { name: '黑龙江', value: 0 }, { name: '湖南', value: 0 },
      { name: '安徽', value: 0 }, { name: '山东', value: 0 },
      { name: '新疆', value: 0 }, { name: '江苏', value: 0 },
      { name: '浙江', value: 0 }, { name: '江西', value: 0 },
      { name: '湖北', value: 0 }, { name: '广西', value: 0 },
      { name: '甘肃', value: 0 }, { name: '山西', value: 0 },
      { name: '内蒙古', value: 0 }, { name: '陕西', value: 0 },
      { name: '吉林', value: 0 }, { name: '福建', value: 0 },
      { name: '贵州', value: 0 }, { name: '广东', value: 0 },
      { name: '青海', value: 0 }, { name: '西藏', value: 0 },
      { name: '四川', value: 0 }, { name: '宁夏', value: 0 },
      { name: '海南', value: 0 }, { name: '台湾', value: 0 },
      { name: '香港', value: 0 }, { name: '澳门', value: 0 }]
  }],

};

let chart = null;

function initChart(canvas, width, height) {
  echarts.registerMap('china', geoJson);

  chart = echarts.init(canvas, null, {
    width: width,
    height: height
  });
  canvas.setChart(chart);
  chart.setOption(option);
  return chart;
}

Page({
  data: {
    ec: {
      onInit: initChart
    },
    places: [],
    limit: app.globalData.limit,
    showBtns: false,
    provincesCount: 0,
    placesCount: 0,
    userOpenId: '',
    isScrolling: false,
    isLow: false,
    notMore: false,
    scrollTop: 0,
    isSelf: true,
    // 是否可以添加，做了1分钟限制
    canAdd: true
  },
  onLoad(options) {
    if (options.openid) {
      this.setData({
        userOpenId: options.openid,
      }, _ => {
        this.initData();
        this.init_map();
      })
    } else {
      this.initData();
      this.init_map();
    }
    this.initShake();
  },
  onShareAppMessage: function (res) {
    const result = this.analysisData();
    const title = '我的足迹跨域了' + this.data.provincesCount + '个省共' + this.data.placesCount + '个地方，击败了' + Math.floor((this.data.provincesCount / 36 * 100)) + '%的驴友，你呢？';
    return {
      title: title,
      path: '/pages/index/index?openid=' + app.globalData.openid,
      success: function () { },
      fail: function () { }
    }
  },
  init_map() {
    this.initMapData().then(res => {
      // 更新显示数据
      this.setData({
        provincesCount: res.provincesCount,
        placesCount: res.placesCount
      })
      // 更新地图数据
      option.series[0].data = res.mapData;
      if (res.placesCount) {
        option.title.text = '跨越了' + res.provincesCount + '省，共去过' + res.placesCount + '个地方';
      } else {
        option.title.text = '当前还没有点亮任何足迹，加油！'
      }
      chart.setOption(option);
    });
  },
  addPrintClick() {
    wx.navigateTo({
      url: '/pages/form/index'
    })
    // wx.chooseLocation({
    //   success: (res) => {
    //     const address = res.address;
    //     const provinceRgx = /(北京市|天津市|上海市|重庆市|河北省|河南省|云南省|辽宁省|黑龙江省|湖南省|安徽省|山东省|新疆维吾尔自治区|江苏省|浙江省|江西省|湖北省|广西壮族自治区|甘肃省|山西省|内蒙古自治区|陕西省|吉林省|福建省|贵州省|广东省|青海省|西藏自治区|四川省|宁夏回族自治区|海南省|台湾省|香港特别行政区|澳门特别行政区)/g;
    //     const provinceArr = address.match(provinceRgx);
    //     if (provinceArr && provinceArr.length) {
    //       let province = provinceArr[0];
    //       province = province.replace(/[省市(壮族自治区)(维吾尔自治区)(自治区)(回族自治区)(特别行政区)]/g, '');
    //       res.province = province;
    //     }
    //     res['_openid'] = app.globalData.openid;
    //     const now = new Date();
    //     res.time = utils.formatTime(now);
    //     res.timestamp = Date.parse(now);
    //     this.addPrint(res);
    //   }
    // })
  },
  addPrint(data) {
    wx.cloud.callFunction({
      name: 'add',
      data: {
        data: data
      }
    }).then(res => {
      this.setData({
        places: [data, ...this.data.places]
      }, _ => {
        this.init_map();
        wx.hideLoading();
        wx.showToast({
          title: '签到成功',
        });
        wx.startAccelerometer({
        });
      })
    })
  },
  initData() {
    wx.showLoading({
      title: '加载中'
    })
    if (this.data.places.length) {
      const places = this.data.places;
      const lastTimestamp = (places[places.length - 1]['timestamp']);
      wx.cloud.callFunction({
        name: 'get',
        data: {
          lastTimestamp: lastTimestamp,
          openid: this.data.userOpenId
        }
      }).then(res => {
        wx.hideLoading();
        if (!res.result.data.length) {
          wx.showToast({
            title: '没有更多数据'
          })
          this.setData({
            notMore: true
          })
          return;
        }
        this.setData({
          places: [...this.data.places, ...res.result.data],
          isLow: false
        }, _ => {
          this.initMapData();
        })
      })
    } else {
      wx.cloud.callFunction({
        name: 'get',
        data: {
          openid: this.data.userOpenId
        }
      }).then(res => {
        wx.hideLoading();
        if (res.result.data.length) {
          this.setData({
            places: res.result.data
          }, _ => {
            this.initMapData();
          })
        } else {
          this.setData({
            notMore: true
          })
        }
      })
    }
  },
  initMapData() {
    return wx.cloud.callFunction({
      name: 'getMap',
      data: {
        openid: this.data.userOpenId
      }
    }).then(res => {
      const data = res.result.result.data;
      // 获取本人的openid，并判断当前页面是否显示本人
      const openid = res.result.openid;
      app.globalData.openid = openid;
      this.setData({
        isSelf: !this.data.userOpenId || this.data.userOpenId === openid
      })
      if (data && data.length) {
        const provinces = data[0].provinces;
        const mapData = [];
        let provincesCount = 0;
        let placesCount = 0;
        for (let key in provinces) {
          mapData.push({
            name: key,
            value: provinces[key]
          })
          if (provinces[key]) {
            provincesCount++;
            placesCount += provinces[key];
          }
        }
        return { mapData, provincesCount, placesCount };
      } else {
        return {
          mapData: [{ name: '北京', value: 0 }, { name: '天津', value: 0 },
          { name: '上海', value: 0 }, { name: '重庆', value: 0 },
          { name: '河北', value: 0 }, { name: '河南', value: 0 },
          { name: '云南', value: 0 }, { name: '辽宁', value: 0 },
          { name: '黑龙江', value: 0 }, { name: '湖南', value: 0 },
          { name: '安徽', value: 0 }, { name: '山东', value: 0 },
          { name: '新疆', value: 0 }, { name: '江苏', value: 0 },
          { name: '浙江', value: 0 }, { name: '江西', value: 0 },
          { name: '湖北', value: 0 }, { name: '广西', value: 0 },
          { name: '甘肃', value: 0 }, { name: '山西', value: 0 },
          { name: '内蒙古', value: 0 }, { name: '陕西', value: 0 },
          { name: '吉林', value: 0 }, { name: '福建', value: 0 },
          { name: '贵州', value: 0 }, { name: '广东', value: 0 },
          { name: '青海', value: 0 }, { name: '西藏', value: 0 },
          { name: '四川', value: 0 }, { name: '宁夏', value: 0 },
          { name: '海南', value: 0 }, { name: '台湾', value: 0 },
          { name: '香港', value: 0 }, { name: '澳门', value: 0 }],
          provincesCount: 0,
          placesCount: 0
        }
      }
    })
  },
  lower() {
    this.setData({
      isScrolling: true,
      isLow: true
    })
    if (this.data.notMore) {
      return;
    }
    this.initData();
  },
  upper() {
    this.setData({
      isScrolling: false,
      isLow: false
    })
  },
  showBtns() {
    this.setData({
      showBtns: !this.data.showBtns
    })
  },
  analysisData() {
    const places = this.data.places;
    let provinces = places.map(item => {
      return item.province;
    })
    provinces = new Set(provinces);
    return {
      length: places.length,
      provinces: provinces
    }
  },
  scrollViewClick() {
    this.setData({
      showBtns: false
    })
  },
  mapContainerClick() {
    this.setData({
      isScrolling: false,
      showBtns: false,
      scrollTop: 0
    })
  },
  generate() {
    this.setData({
      userOpenId: app.globalData.openid,
      places: []
    }, _ => {
      this.initData();
      this.init_map();
    })
  },
  submit(e) {
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
      
      // wx.cloud.callFunction({
      //   name: 'send',
      //   data: {
      //     modelData: modelData
      //   }
      // }).then(res => {
      //   console.log(res);
      // })
    }
  },
  // 初始化摇一摇签到功能
  initShake() {
    const self = this;
    wx.onAccelerometerChange(function (res) {
      // 达到一定得晃动程度才执行
      if (Math.abs(res.x) > 0.7 && Math.abs(res.y) > 0.7) {
        if (!self.data.canAdd) {
          wx.showToast({
            title: '过一会再来添加',
          })
          return;
        }
        self.setData({
          canAdd: false
        })
        setTimeout(_ => {
          self.setData({
            canAdd: true
          })
        }, app.globalData.addInterval)
        // 获取用户的位置
        wx.stopAccelerometer({
          success: _ => {
            wx.showLoading({
              title: '点亮足迹中'
            });
            wx.getLocation({
              success: function (res) {
                self.getDetailPosition(res).then(result => {
                  console.log(result);
                  if (result.data.status === 0) {
                    self.handlePosition(result.data.result);
                  }
                });
              },
            })    
          }
        })
      }
    })
  },
  handlePosition(result) {
    const data = {
      _openid: app.globalData.openid,
      address: result.address,
      content: '',
      filelds: []
    };
    let province = result.address_component.province;
    province = province.replace(/[省市(壮族自治区)(维吾尔自治区)(自治区)(回族自治区)(特别行政区)]/g, '');
    data.province = province;
    const now = new Date();
    data.time = utils.formatTime(now).complete;
    data.timestamp = Date.parse(now);
    if (result.address_reference) {
      const reference = result.address_reference;
      if (reference.famous_area && reference.famous_area.title) {
        data.latitude = reference.famous_area.location.lat;
        data.longitude = reference.famous_area.location.lng;
        data.name = reference.famous_area.title;
      } else if (reference.business_area && reference.business_area.title) {
        data.latitude = reference.business_area.location.lat;
        data.longitude = reference.business_area.location.lng;
        data.name = reference.business_area.title;
      } else if (reference.landmark_l2 && reference.landmark_l2.title) {
        data.latitude = reference.landmark_l2.location.lat;
        data.longitude = reference.landmark_l2.location.lng;
        data.name = reference.landmark_l2.title;
      } else if (reference.landmark_l1 && reference.landmark_l1.title) {
        data.latitude = reference.landmark_l1.location.lat;
        data.longitude = reference.landmark_l1.location.lng;
        data.name = reference.landmark_l1.title;
      } else if (reference.landmark_l1 && reference.landmark_l1.title) {
        data.latitude = reference.landmark_l1.location.lat;
        data.longitude = reference.landmark_l1.location.lng;
        data.name = reference.landmark_l1.title;
      } 
    } else if (result.pois && result.pois.length) {
      const poi = result.pois[0];
      data.latitude = poi.location.lat;
      data.longitude = poi.location.lng;
      data.name = poi['title'];
    } else if (result.location) {
      data.latitude = result.location.lat;
      data.longitude = result.location.lng;
      let address_component = result.address_component;
      data.name = address_component.street || address_component.district || address_component.city;
    }
    this.addPrint(data);
  },
  getDetailPosition(obj) {
    return new Promise((resolve, reject) => {
      const self = this;
      wx.request({
        url: 'https://apis.map.qq.com/ws/geocoder/v1/?location=' + obj.latitude + ',' + obj.longitude + '&key=NI2BZ-RZFCP-A4DD7-LNHD4-YTVAO-DJFGY&get_poi=1',
        success: res => {
          resolve(res);
        },
        fail: msg => {
          wx.showToast({
            title: msg
          })
        }
      })
    })
  },
});
