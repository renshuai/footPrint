// 云函数入口文件
const cloud = require('wx-server-sdk');
const utils = require('./utils.js');

cloud.init({
  env: 'footprint-46e6ce'
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const location = event.location;
  try {
    const res = await db.collection('places').add({
      // data 字段表示需新增的 JSON 数据
      data: location
    })
    // 将数据同时放到overview的数据中

    let count = await db.collection('overviews').where({
      '_openid': location['_openid']
    }).count();
    if (count.total > 0) {
      return await db.collection('overviews').where({
        '_openid': location['_openid']
      }).get().then(async (result) => {
        if (result.data.length) {
          let overviewInfo = result.data[0];
          overviewInfo['provinces'][location.province] += 1;
          return await db.collection('overviews').where({
            '_openid': location['_openid']
          }).update({
            data: {
              provinces: overviewInfo['provinces']
            }
          })
        }
      });
      
    } else {
      let provinces = {
        '北京': 0,
        '天津': 0,
        '上海': 0,
        '重庆': 0,
        '河北': 0,
        '河南': 0,
        '云南': 0,
        '辽宁': 0,
        '黑龙江': 0,
        '湖南': 0,
        '安徽': 0,
        '山东': 0,
        '新疆': 0,
        '江苏': 0,
        '浙江': 0,
        '江西': 0,
        '甘肃': 0,
        '山西': 0,
        '内蒙古': 0,
        '陕西': 0,
        '吉林': 0,
        '福建': 0,
        '贵州': 0,
        '广东': 0,
        '青海': 0,
        '西藏': 0,
        '四川': 0,
        '宁夏': 0,
        '海南': 0,
        '台湾': 0,
        '香港': 0,
        '澳门': 0,
        '广西': 0,
        '湖北': 0
      };
      provinces[location.province] = 1;
      console.log(provinces);
      return await db.collection('overviews').add({
        data: {
          '_openid': location['_openid'],
          'provinces': provinces
        }
      })
    }
  } catch (e) {
    console.error(e)
  }
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}