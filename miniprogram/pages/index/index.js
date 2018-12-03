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
    canAdd: true,
    handleIndex: -1
  },
  onLoad(options) {
    if (options.openid) {
      this.setData({
        userOpenId: options.openid,
      }, _ => {
        this.initData();
      })
    } else {
      this.initData();
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
        option.title.text = '赶快晃动手机来点亮你的足迹吧'
      }
      chart.setOption(option);
    });
  },
  addPrint(data) {
    wx.cloud.callFunction({
      name: 'add',
      data: {
        data: data
      }
    }).then(res => {
      if (res.result && res.result._id) {
        data._id = res.result._id;
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
      }
    }).catch(_ => {
        wx.hideLoading();
        wx.showToast({
          title: '签到失败'
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
        if (!res.result.data || !res.result.data.length) {
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
          this.init_map();
        })
      }).catch(error => {
        wx.hideLoading();
        wx.showToast({
          title: '数据加载失败'
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
        if (res.result.data && res.result.data.length) {
          this.setData({
            places: res.result.data
          }, _ => {
            this.init_map();
          })
        }
        }).catch(error => {
          wx.hideLoading();
          wx.showToast({
            title: '数据加载失败'
          })
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
      if (!res.result || !res.result.result) {
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
    }).catch(error => {
      wx.showToast({
        title: '数据加载失败'
      })
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
      if (Math.abs(res.x) > 1 && Math.abs(res.y) > 1) {
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
              type: 'gcj02',
              success: function (res) {
                self.getDetailPosition(res).then(result => {
                  console.log(result);
                  if (result.data.status === 0) {
                    self.handlePosition(result.data.result);
                  }
                });
              },
              fail: _ => {
                wx.hideLoading();
                wx.showToast({
                  title: '获取位置失败'
                })
              }
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
      fileIds: []
    };
    let province = result.address_component.province;
    province = province.replace(/[省市(壮族自治区)(维吾尔自治区)(自治区)(回族自治区)(特别行政区)]/g, '');
    data.province = province;
    const now = new Date();
    data.time = utils.formatTime(now).time;
    data.date = utils.formatTime(now).date;
    data.timestamp = Date.parse(now);
    if(result.pois && result.pois.length) {
      const poi = result.pois[0];
      data.latitude = poi.location.lat;
      data.longitude = poi.location.lng;
      data.name = poi['title'];
      if (poi.category) {
        const iconClass  = this.getCategoryClass(poi.category);
        if (iconClass) {
          data.class = iconClass;
        }
      }
    } else if (result.address_reference) {
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
    } else if (result.location) {
      data.latitude = result.location.lat;
      data.longitude = result.location.lng;
      let address_component = result.address_component;
      data.name = address_component.street || address_component.district || address_component.city;
    }
    data.class = data.class || 'icon-didian01';
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
          wx.hideLoading();
          wx.showToast({
            title: msg
          })
        }
      })
    })
  },
  getCategoryClass(category) {
    // let type = '';
    let iconClass = '';
    const typeObj = {
      '美食': {
        children: {
          '中餐厅': {
            'class': 'icon-zhongcan'
          },
          '日本料理': {
            'class': ''
          },
          '西餐': {
            'class': 'icon-canpinhui-xican'
          },
          '烧烤': {
            'class': 'icon-shaokao'
          },
          '火锅': {
            'class': 'icon-hotpot'
          },
          '海鲜': {
            'class': 'icon-haixian'
          },
          '素食': {
            'class': 'icon-jinkoupengdiaosushi'
          },
          '清真': {
            'class': 'icon-lvyoujianzhumingshenggujitourism-daqingzhensi'
          },
          '自助餐': {
            'class': ''
          },
          '面包甜点': {
            'class': 'icon-cake'
          },
          '冷饮店': {
            'class': 'icon-lengyin'
          },
          '小吃快餐': {
            'class': 'icon-kuaican'
          }
        },
        type: 'food',
        class: 'icon-canpinhui-xican',
        'getFormChildren': true
      },
      '购物': {
        children: {
          '综合商场': {
            'class': ''
          },
          '便利店': {
            'class': 'icon-bianlidian'
          },
          '超市': {
            'class': 'icon-chaoshi'
          },
          '数码家电': {
            'class': 'icon-shuma'
          },
          '花鸟鱼虫': {
            'class': 'icon-hua'
          },
          '家具家居建材': {
            'class': 'icon-jiaju'
          },
          '农贸市场': {
            'class': 'icon-shucai'
          },
          '小商品市场': {
            'class': ''
          },
          '旧货市场': {
            'class': 'icon-ershoushebei'
          },
          '体育户外': {
            'class': 'icon-yundong'
          },
          '服饰鞋包': {
            'class': 'icon-yifu'
          },
          '图书音像': {
            'class': 'icon-tushu'
          },
          '眼镜店': {
            'class': 'icon-yanjing'
          },
          '母婴儿童': {
            'class': 'icon-muying'
          },
          '珠宝饰品': {
            'class': 'icon-zhubao'
          },
          '化妆品': {
            'class': 'icon-huazhuangpin'
          },
          '礼品': {
            'class': 'icon-shangpin'
          },
          '摄影器材': {
            'class': 'icon-sheying'
          },
          '拍卖典当行': {
            'class': 'icon-paimai'
          },
          '古玩字画': {
            'class': 'icon-guwan'
          },
          '自行车专卖': {
            'class': 'icon-zihangche'
          },
          '烟酒专卖': {
            'class': 'icon-xiangyan'
          },
          '文化用品': {
            'class': 'icon-wenhuayuandi'
          }
        },
        type: 'shopping',
        class: 'icon-xiazai49',
        'getFormChildren': false
      },
      '生活服务': {
        children: {
          '旅行社': {
            'class': ''
          },
          '票务代售': {
            'class': 'icon-huochezhan'
          },
          '邮局速递': {
            'class': 'icon-kuaidi'
          },
          '通讯服务': {
            'class': 'icon-yunyingshang'
          },
          '报刊亭': {
            'class': 'icon-iconset0184'
          },
          '自来水营业厅': {
            'class': 'icon-shuilongtou'
          },
          '电力营业厅': {
            'class': 'icon-electricity_icon'
          },
          '摄影冲印': {
            'class': 'icon-dayin'
          },
          '洗衣店': {
            'class': 'icon-xiyiji'
          },
          '招聘求职': {
            'class': 'icon-zhaopin'
          },
          '彩票': {
            'class': 'icon-caipiao'
          },
          '家政': {
            'class': 'icon-swticonjiazheng'
          },
          '中介机构': {
            'class': 'icon-fuwu'
          },
          '宠物服务': {
            'class': 'icon-chongwu'
          },
          '废品收购站': {
            'class': 'icon-lajigarbage7'
          },
          '福利院养老院': {
            'class': 'icon-laoren'
          },
          '美容美发': {
            'class': 'icon-meifa'
          }
        },
        type: 'service',
        class: 'icon-fuwuzhongjiewuye',
        'getFormChildren': true
      },
      '娱乐休闲': {
        children: {
          '洗浴推拿足疗': {
            'class': 'icon-Massage'
          },
          'KTV': {
            'class': 'icon-yule'
          },
          '酒吧': {
            'class': 'icon-jiuba'
          },
          '咖啡厅': {
            'class': 'icon-kafei'
          },
          '夜总会': {
            'class': ''
          },
          '电影院': {
            'class': 'icon-dianyingyuan'
          },
          '剧场音乐厅': {
            'class': 'icon-yinle'
          },
          '度假疗养': {
            'class': ''
          },
          '游乐场': {
            'class': 'icon-youlechang'
          },
          '垂钓园': {
            'class': 'icon-Fishing'
          },
          '采摘园': {
            'class': 'icon-rengongcaizhai'
          },
          '游戏厅': {
            'class': 'icon-youxi'
          },
          '棋牌室': {
            'class': 'icon-qipaishi'
          },
          '网吧': {
            'class': 'icon-shubiao'
          }
        },
        type: 'entertainment',
        class: 'icon-yule',
        'getFormChildren': true
      },
      '汽车': {
         children: {
            '加油站': {
              'class': 'icon-jiayouzhan'
            },
            '停车场': {
              'class': 'icon-tingchechang'
            },
            '汽车销售': {
             'class': ''
            },
            '汽车维修': {
              'class': 'icon-weixiu'
            },
            '摩托车': {
              'class': 'icon-motuoche'
            },
            '汽车养护': {
             'class': ''
            },
            '洗车场': {
              'class': 'icon-xichekaidan'
            }
         },
        type: 'car',
        class: 'icon-qiche',
        'getFormChildren': true
      },
      '医疗保健': {
        type: 'hospital',
        class: 'icon-yiyuan',
        'getFormChildren': false
      },
      '酒店宾馆': {
        type: 'hotel',
        class: 'icon-hotel',
        'getFormChildren': false
      },
      '旅游景点': {
        type: 'tourism',
        class: 'icon-jingdian',
        'getFormChildren': false
      },
      '文化场馆': {
        type: 'museum',
        class: 'icon-bowuguan',
        'getFormChildren': false
      },
      '教育学校': {
        type: 'school',
        class: 'icon-xuexiao',
        'getFormChildren': false
      },
      '银行金融': {
        type: 'bank',
        class: 'icon-iconset0291',
        'getFormChildren': false
      },
      '基础设施': {
        children: {
          '公交车站': {
            'class': 'icon-gongjiaozhan'
          },
          '地铁站': {
            'class': 'icon-ditiexiao'
          },
          '火车站': {
            'class': 'icon-huochezhan'
          },
          '长途汽车站': {
            'class': 'icon-qichezhantianchong'
          },
          '公交线路': {
            'class': 'icon-gongjiaoxianlu'
          },
          '地铁线路': {
            'class': 'icon-changyonglogo15'
          },
          '公共厕所': {
            'class': 'icon-cesuo'
          },
          '公用电话': {
            'class': 'icon-icon-tel'
          },
          '紧急避难场所': {
            'class': 'icon-guangchangsquare107'
          },
          '收费站': {
            'class': 'icon-shoufeizhan'
          },
          '服务区': {
            'class': 'icon-fuwuqu'
          },
          '其它基础设施': {
            'class': 'icon-erji-jichusheshi'
          }
        },
        type: 'basic',
        class: 'icon-jianshe',
        'getFormChildren': true
      },
      '房产小区': {
        children: {
          '住宅小区': {
            'class': 'icon-haofangtuo400iconfont2xiaoqu'
          },
          '别墅': {
            'class': 'icon-bieshu'
          },
          '宿舍': {
            'class': 'icon-sushe'
          },
          '社区中心': {
            'class': 'icon-shequ'
          },
          '商务楼宇': {
            'class': 'icon-icon-'
          }
        },
        type: 'apartment',
        class: 'icon-haofangtuo400iconfont2xiaoqu',
        'getFormChildren': false
      },
      '公司企业': {
        type: 'company',
        class: 'icon-iconset0291',
        'getFormChildren': false
      }
    }
    for (let key in typeObj) {
      if (category.startsWith(key)) {
        if (typeObj[key]['getFormChildren'] && typeObj[key]['children']) {
          const children = typeObj[key]['children'];
          for (let childKey in children) {
            if (category.includes(childKey)) {
              iconClass = children[childKey]['class'] || typeObj[key]['class'];
              break;
            }
          }
        } else {
          iconClass = typeObj[key]['class'];
        }
        break;
      } 
    }
    return iconClass;
  },
  touchStart(e) {
    const touch = e.touches[0];
    this.setData({
      startX: touch.pageX,
      startY: touch.pageY
    })
  },
  touchMove(e) {
  },
  touchEnd(e) {
    const touch = e.changedTouches[0];
    const diffX = touch.pageX - this.data.startX;
    const diffY = touch.pageY - this.data.startY;
    if (diffX < 0) {
      // 左滑
      if (Math.abs(diffX) > 30 && Math.abs(diffY) < 30) {
        // 超过一定距离，触发事件
        const index = e.target.dataset.index;
        this.setData({
          handleIndex: index
        })
      } 
    } else {
      this.setData({
        handleIndex: -1
      })
    }
  },
  delete(e) {
    wx.showLoading({
      title: '删除中'
    })
    const index = e.currentTarget.dataset.index;
    const deleteData = this.data.places[index];
    const _id = deleteData['_id'];
    // 删除places集合对应的数据
    wx.cloud.callFunction({
      name: 'delete',
      data: {
        id: _id
      }
    }).then(res => {
      this.init_map();
      const places = JSON.parse(JSON.stringify(this.data.places));
      places.splice(index, 1);
      this.setData({
        places: places
      })
      wx.hideLoading();
      wx.showToast({
        title: '删除成功'
      })
    }).catch(error => {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败'
      })
    });
  },
  showDetail(e) {
    console.log(e);
    const index = e.currentTarget.dataset.index;
    const detailData = this.data.places[index];
    console.log(detailData);
    const _id = detailData['_id'];
    wx.navigateTo({
      url: '/pages/detail/index?id=' + _id + '&isSelf=' + this.data.isSelf
    })
  }
});
