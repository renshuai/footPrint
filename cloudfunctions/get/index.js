// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const lastTimestamp = event.lastTimestamp
  const openid = event.openid || event.userInfo.openId;
  console.log(openid);
  if (lastTimestamp) {
    const command = db.command;
    return await db.collection('places').where({
      timestamp: command.lt(lastTimestamp),
      _openid: openid
    }).orderBy('timestamp', 'desc').get();
  } else {
    return await db.collection('places').where({
      _openid: openid
    }).orderBy('timestamp', 'desc').get();
  }
}