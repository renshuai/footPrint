import * as echarts from '../../ec-canvas/echarts';
import geoJson from './chinaData.js';
import utils from '../../utils/utils';

const app = getApp();

const option = {
  title: {
    text: '',
    textStyle: {
      color: '#fff',
      fontSize: 14
    },
    left: 'center',
    top: 'bottom'

  },
  tooltip: {
    trigger: 'item',
    formatter: '{b}{c}'
  },
  visualMap: {
    min: 0,
    max: 5,
    left: 'left',
    top: 'bottom',
    text: ['高', '低'], // 文本，默认为数值文本
    calculable: true,
    inRange: {
      color: ['#6bd8dd', '#336666']
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
    isSelf: true
  },
  onReady() {
    this.initData();
    this.init_map();
  },
  onLoad(options) {
    this.setData({
      userOpenId: options.openid || app.globalData.openid,
      isSelf: (!options.openid || options.openid === app.globalData.openid) ? true : false
    })
    
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
    wx.chooseLocation({
      success: (res) => {
        const address = res.address;
        const provinceRgx = /(北京市|天津市|上海市|重庆市|河北省|河南省|云南省|辽宁省|黑龙江省|湖南省|安徽省|山东省|新疆维吾尔自治区|江苏省|浙江省|江西省|湖北省|广西壮族自治区|甘肃省|山西省|内蒙古自治区|陕西省|吉林省|福建省|贵州省|广东省|青海省|西藏自治区|四川省|宁夏回族自治区|海南省|台湾省|香港特别行政区|澳门特别行政区)/g;
        const provinceArr = address.match(provinceRgx);
        if (provinceArr && provinceArr.length) {
          let province = provinceArr[0];
          province = province.replace(/[省市(壮族自治区)(维吾尔自治区)(自治区)(回族自治区)(特别行政区)]/g, '');
          res.province = province;
        }
        res['_openid'] = app.globalData.openid;
        const now = new Date();
        res.time = utils.formatTime(now);
        res.timestamp = Date.parse(now);
        this.addPrint(res);
      }
    })
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
        wx.showToast({
          title: '签到成功',
        });
      })
    })
  },
  initData() {
    if (this.data.places.length) {
      const places = this.data.places;
      // 跳过现有数据，去加载最新数据
      const db = wx.cloud.database({
        env: app.globalData.env
      })
      const lastTimestamp = (places[places.length - 1]['timestamp']);
      const command = db.command;
      db.collection('places').orderBy('timestamp', 'desc').where({
        timestamp: command.lt(lastTimestamp)
      }).get().then(res => {
        if (!res.data.length) {
          wx.showToast({
            title: '没有更多数据'
          })
          return;
        }
        this.setData({
          places: [...this.data.places, ...res.data]
        }, _ => {
          this.initMapData();
        })
      })
    } else {
      const db = wx.cloud.database({
        env: app.globalData.env
      })
      db.collection('places').orderBy('timestamp', 'desc').get().then(res => {
        if (res.data.length) {
          this.setData({
            places: res.data
          }, _ => {
            this.initMapData();
          })
        }
      })
    }
  },
  initMapData() {
    const db = wx.cloud.database({
      env: app.globalData.env
    })
    return db.collection('overviews').get().then(res => {
      console.log(res);
      const data = res.data;
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
        return {mapData, provincesCount, placesCount};
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
