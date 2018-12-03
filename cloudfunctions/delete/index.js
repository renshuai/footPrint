// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const id = event.id;
  const doc = await db.collection('places').doc(id).get();
  // 删除places中的记录
  const res = await db.collection('places').doc(id).remove();
  if (res.stats.removed === 1) {
    // 删除成功，这时候更新overviews中的数据
    if (doc.data && doc.data.province) {
      const province = doc.data['province'];
      console.log(province);
      return await db.collection('overviews').where({
        '_openid': event.userInfo.openId
      }).get().then(async (result) => {
        if (result.data.length) {
          let overviewInfo = result.data[0];
          overviewInfo['provinces'][province] -= 1;
          if (overviewInfo['provinces'][province] < 0) {
            overviewInfo['provinces'][province] = 0;
          }
          return await db.collection('overviews').where({
            '_openid': event.userInfo.openId
          }).update({
            data: {
              provinces: overviewInfo['provinces']
            }
          })
        }
      });
    }
  } 
}