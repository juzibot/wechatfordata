const oracledb = require("oracledb");
oracledb.poolMax = 100;
oracledb.poolMin = 1;
oracledb.poolPingInterval = 20;
oracledb.poolTimeout = 0;

// 初始化连接池
var pool = {};
let iniParser = require('iniparser');
let config = iniParser.parseSync('./resource/config.ini');
async function initPool() {
    try {
        await oracledb.createPool({
            _enableStats: true,
            user: config['DB']['user'],
            password: config['DB']['password'],  // mypw contains the hr schema password
            connectString: config['DB']['connectString'],
            poolAlias: 'edwpool'
        });
        pool['edwpool'] = true;
    } catch (err) {
        pool['edwpool'] = false;
        console.error(err.message);
        throw new Error('连接池'+'edwpool'+"创建失败！")
    }
}

//查询函数
async function executeSql(dataSource, sql) {
    let conn = await oracledb.getPool(dataSource).getConnection();
    try {
        return await conn.execute(sql);
    } catch (e) {
        console.log(e)
    } finally {
        await conn.close();
    }
}

module.exports = {
    initPool,
    executeSql
};
