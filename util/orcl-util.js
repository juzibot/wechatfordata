const oracledb = require("oracledb");
oracledb.poolMax = 100;
oracledb.poolMin = 1;
oracledb.poolPingInterval = 20;
oracledb.poolTimeout = 0;

// 初始化连接池
var pool = {};
async function initPool() {
    try {
        await oracledb.createPool({
            _enableStats: true,
            user: '*',
            password: '*',  // mypw contains the hr schema password
            connectString: '*',
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

/*(async ()=>{
    try{
        await oracledb.createPool({
            _enableStats: true,
            user: 'AZ_DB_READ',
            password: 'Help2019',
            connectString: 'CNDCWEDWP001:1521/edw',
            poolAlias: "edwpool"
        });
        var connection =  await oracledb.getPool('edwpool').getConnection();
        var result = await connection.execute('select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=\'CGMDU02034345\'');
        await connection.close();
        console.log(result)
    }catch(err){
        console.log(err.message)
    }
})();*/

/*

(async ()=>{
    try {
        await oracledb.createPool({
            _enableStats: true,
            user: 'AZ_DB_READ',
            password: 'Help2019',
            connectString: 'CNDCWEDWP001:1521/edw',
            poolAlias: "edwpool"
        });
    } catch (err) {
        console.log(err.message)
    }
    const conn = await oracledb.getPool('edwpool').getConnection();
    // const result = await executeSql('edwpool', 'select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=dddd');
    const result = await conn.execute(
        'select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=\'CGMDU02034345\'' // bind value for :id
    );
    await conn.close();
    console.log(result.rows);
    //!*console.log({ metaData, rows });

})();
*/
