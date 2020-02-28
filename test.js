const { oracledb } = require("oracledb");
const { OrclUtil } = require('./util/orcl-util');
const str = '活动推送查询CFO1234456';
console.log(str.indexOf('活动推送查询') >= 0);
console.log(str.slice(6,str.length));
(async () => {
    OrclUtil.initPool();
    const conn = await oracledb.getPool('你edwpool').getConnection();
    const result = await conn.execute(
        'edwpool', `select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=${str.slice(6, str.length)}`);
    debugger;
    let data = [];
    for (let i = 0; i < rows.length; i++) {
        let temp = {};
        for (let j = 0; j < metaData.length; j++) {
            temp[metaData[j]['name']] = rows[i][j];
        }
        data.push(temp);
        console.log(JSON.stringify(data));
    }
});
