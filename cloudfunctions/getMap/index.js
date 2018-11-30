// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const openid = event.openid || event.userInfo.openId;
  const count = await db.collection('overviews').where({
    _openid: openid
  }).count();
  console.log(count);
  if (!count.total) {
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
    await db.collection('overviews').add({
      data: {
        '_openid': openid,
        'provinces': provinces
      }
    })
  }

  const res = await db.collection('overviews').where({
    _openid: openid
  }).get();
  return {
    result: res,
    openid: event.userInfo.openId
  }
  
}