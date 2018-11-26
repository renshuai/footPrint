import * as echarts from '../../ec-canvas/echarts';
import geoJson from './chinaData.js';
import utils from '../../utils/utils';

const app = getApp();

function initChart(canvas, width, height) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height
  });
  canvas.setChart(chart);

  echarts.registerMap('china', geoJson);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}{c}'
    },
    visualMap: {
      show: false,
      min: 0,
      max: 100,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'], // 文本，默认为数值文本
      calculable: true,
      inRange: {
        color: ['#fff','#006699']
      }
    },
    toolbox: {
      show: true,
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
          areaColor: '#389BB7',
          borderWidth: 0
        }
      },
      animation: false,
      data: [
        { name: '北京', value: '100' }, { name: '天津', value: randomData() },
        { name: '上海', value: randomData() }, { name: '重庆', value: randomData() },
        { name: '河北', value: randomData() }, { name: '河南', value: randomData() },
        { name: '云南', value: randomData() }, { name: '辽宁', value: randomData() },
        { name: '黑龙江', value: randomData() }, { name: '湖南', value: randomData() },
        { name: '安徽', value: randomData() }, { name: '山东', value: randomData() },
        { name: '新疆', value: randomData() }, { name: '江苏', value: randomData() },
        { name: '浙江', value: randomData() }, { name: '江西', value: randomData() },
        { name: '湖北', value: randomData() }, { name: '广西', value: randomData() },
        { name: '甘肃', value: randomData() }, { name: '山西', value: randomData() },
        { name: '内蒙古', value: randomData() }, { name: '陕西', value: randomData() },
        { name: '吉林', value: randomData() }, { name: '福建', value: randomData() },
        { name: '贵州', value: randomData() }, { name: '广东', value: randomData() },
        { name: '青海', value: randomData() }, { name: '西藏', value: randomData() },
        { name: '四川', value: randomData() }, { name: '宁夏', value: randomData() },
        { name: '海南', value: randomData() }, { name: '台湾', value: randomData() },
        { name: '香港', value: randomData() }, { name: '澳门', value: randomData() }
      ]
    }],

  };

  chart.setOption(option);

  return chart;
}

function randomData() {  
     return Math.round(Math.random()*100);  
} 

Page({
  onShareAppMessage: function (res) {
    const result = this.analysisData();
    const title = '我的足迹跨域了' + result.provinces.size + '个省共' + result.length + '个地方，击败了' + Math.floor((result.provinces.size / 36 * 100)) + '%的驴友，你呢？';
    return {
      title: title,
      path: '/pages/index/index',
      success: function () { },
      fail: function () { }
    }
  },
  data: {
    ec: {
      onInit: initChart
    },
    places: [],
    limit: app.globalData.limit,
    showBtns: false
  },

  onReady() {
    this.initData();
  },
  addPrintClick() {
    wx.chooseLocation({
      success: (res) => {
        const address = res.address;
        const provinceRgx = /(北京市|天津市|上海市|重庆市|河北省|河南省|云南省|辽宁省|黑龙江省|湖南省|安徽省|山东省|新疆维吾尔自治区|江苏省|浙江省|江西省|湖北省|广西壮族自治区|甘肃省|山西省|内蒙古自治区|陕西省|吉林省|福建省|贵州省|广东省|青海省|西藏自治区|四川省|宁夏回族自治区|海南省|台湾省|香港特别行政区|澳门特别行政区)/g;
        const provinceArr = address.match(provinceRgx);
        if (provinceArr && provinceArr.length) {
          res.province = provinceArr[0];
        }
        const now = new Date();
        res.time = utils.formatTime(now);
        res.timestamp = Date.parse(now);
        this.addPrint(res);
      }
    })
  },
  addPrint(data) {
    const db = wx.cloud.database({
      env: app.globalData.env
    })
    db.collection('places').add({
      data: data
    }).then(res => {
      wx.showToast({
        title: '签到成功',
      });
      this.initData();
    })
  },
  initData() {
    if (this.data.places.length) {
      // 跳过现有数据，去加载最新数据
      const db = wx.cloud.database({
        env: app.globalData.env
      })
      db.collection('places').skip(this.data.places.length).get().then(res => {
        if (!res.data.length) {
          wx.showToast({
            title: '没有更多数据'
          })
          return;
        }
        this.setData({
          places: [...res.data.reverse(), ...this.data.places]
        })
      })
    } else {
      const db = wx.cloud.database({
        env: app.globalData.env
      })
      db.collection('places').get().then(res => {
        if (res.data.length) {
          this.setData({
            places: res.data.reverse()
          })
        }
      })
    }
    
  },
  onReachBottom() {
    // this.getData(false, true);
    console.log(213);
  },
  onPullDownRefresh() {
    wx.stopPullDownRefresh();
    this.initData();
  },
  more() {
    this.initData();
  },
  share() {
    wx.showShareMenu({
      success(res) {
        console.log(res);
      }
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
  }
});
