const { Wechaty } = require('wechaty');
const { PuppetPadplus } = require ('wechaty-puppet-padplus');
const QrcodeTerminal = require('qrcode-terminal');
const OrclUtil = require('./util/orcl-util');
const oracledb = require("oracledb");
const schedule = require('./util/schedule-util');
const sihuo = require('./util/sihuo')

const token = 'puppet_padplus_497f5aeae122d950';

const puppet = new PuppetPadplus({
    token,
});

const name  = 'bot-data-for-bau'

const bot = new Wechaty({
    puppet,
    name, // generate xxxx.memory-card.json and save login data for the next login
});

OrclUtil.initPool();

// 登录
async function onLogin (user) {
    console.log(`${user}登录了`)
    // 登陆后创建定时任务
    await initBAU();
}

//登出
function onLogout(user) {
    console.log(`${user} 登出`)
}

// 创建每日定时任务
async function initBAU() {
    console.log(`设定每日BAU Daily Check`);
    // ESM JOB Check
    let say_bau = '';
    let rule = schedule.getScheduleRule();
    rule.dayOfWeek = [0, new schedule.getScheduleRange(1, 5)];
    rule.hour = 11;
    rule.minute = 45;
    schedule.setSchedule(rule, async () => {
        (async () => {
            say_bau = '------ESM JOB Check------\r\n';
            let result = await OrclUtil.executeSql('edwpool', `SELECT * FROM EDW_DATA.meta_etl_scheduler where (etl_job_type like '%ESM%' or etl_job_type like '%WEBCAST%') and batchid = to_char(sysdate, 'yyyymmdd') order by end_time asc`);
            console.log(result.rows);
            if (result.rows.length > 0) {
                for (let i = 0;i < result.rows.length;i++) {
                    let num = i + 1;
                    say_bau += 'No' + num + '\r\n' + 'BATCHID：' + result.rows[i][0] + '\r\n' + 'ETL_JOB_TYPE：' + result.rows[i][1] + '\r\n'
                        + 'STATUS_FLAG：' + result.rows[i][2] + '\r\n' + 'START_TIME：' + result.rows[i][3] + '\r\n' + 'END_TIME：' + result.rows[i][4] + '\r\n'
                }
            } else {
                say_bau = 'e=ESM JOB 未启动';
            }
            // const room = await bot.Room.find({topic: '佬常头部二号'});
            const contact = await bot.Contact.find({name: '文件传输助手'});
            await contact.say(say_bau);
            console.log('say_bau=' + say_bau);
        })();
    });
    // Webcasting Data Sync Check
    rule = schedule.getScheduleRule();
    rule.dayOfWeek = [0, new schedule.getScheduleRange(1, 5)];
    rule.hour = 8;
    rule.minute = 10;
    schedule.setSchedule(rule, async () => {
        (async () => {
            say_bau = '---Webcasting Sync Check---\r\n';
            let room_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_ROOM`);
            let room_pic_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_ROOM_PICTURE`);
            let room_doc_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_DOCUMENT`);
            let aud_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_AUDIENCE`);
            let inaud_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_INAV_AUDIENCE`);
            let qes_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_QUESTION`);
            let ans_count = await OrclUtil.executeSql('edwpool', `SELECT count(*) FROM webcast.AZ_WEBCAST_STG_SURVEY_ANSWER`);
            say_bau += '房间同步数量：' + room_count.rows[0][0] + '\r\n' + '照片同步数量：' + room_pic_count.rows[0][0] + '\r\n' +
                'document同步数量：' + room_doc_count.rows[0][0] + '\r\n' + '参会者同步数量：' + aud_count.rows[0][0] + '\r\n' +
                '互动参会者同步数量：' + inaud_count.rows[0][0] + '\r\n' + '问卷同步数量：' + qes_count.rows[0][0] + '\r\n' +
                '问卷answer同步数量：' + ans_count.rows[0][0] + '\r\n';
            const room = await bot.Room.find({topic: 'CDC直播间报告 内部沟通群'});
            // const contact = await bot.Contact.find({name: '文件传输助手'});
            await room.say(say_bau);
            console.log('say_bau=' + say_bau);
        })();
    });
    // 夹带私货
    rule = schedule.getScheduleRule();
    rule.dayOfWeek = [0, new schedule.getScheduleRange(1, 7)];
    rule.hour = 6;
    rule.minute = 30;
    schedule.setSchedule(rule, async () => {
        let contact = await bot.Contact.find({name:'dong~dong~'});
        let one = await sihuo.getOne();
        let weather = await sihuo.getWeather();
        let str = '今日天气\r\n' + weather.weatherTips +'\r\n' +weather.todayWeather;
        await contact.say(str)
    });
}

bot
    .on('scan', (qrcode, status) => {
        console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrcode)}`)
        QrcodeTerminal.generate('This will be a small QRCode, eh!', {small: true}, function (qrcode) {
            console.log(qrcode)
        });
    })
    .on('message', async function (msg) {
        /*if (msg.self()) {
            return
        }*/
        if (msg.type() !== bot.Message.Type.Text ) {
            return
        }
        const content = msg.text();
        const contact = msg.from();
        const room = msg.room();
        let say_someting = null;
        let sayOrquiet = false;
        let contact_for_say = null;

        if (room === null) {
            // console.log(`Message in Room: Content: ${content}, Contact: ${contact}`);
            contact_for_say = contact;
        } else {
            // console.log(`Message in Person: Content: ${content}, Contact: ${contact}, Room: ${await room.topic()}`)
            contact_for_say = room;
        }

        if (content === 'wechaty') {
            say_someting = 'welcome to wechaty!';
            await contact_for_say.say(say_someting);
        } else if (content.indexOf('活动推送查询') >= 0) { // 活动推送查询 + event_id
            sayOrquiet = true;
            console.log('活动查询event！');
            (async () => {
                let event_id = content.slice(6, content.length);
                let result = await OrclUtil.executeSql('edwpool', `select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=\'${event_id}\'`)
                // let conn = await oracledb.getPool('edwpool').getConnection();
                // let event_id = content.slice(6, content.length)
                // let result = await conn.execute(`select * from EDW_DATA.DWL_EVENT_WEBCAST where event_id=\'${event_id}\'`);
                // await conn.close();
                console.log(result.rows);
                if (result.rows.length > 0) {
                    say_someting = event_id + '推送时间：' + result.rows[0][3];
                } else {
                    say_someting = '此活动没有推送记录';
                }
                await contact_for_say.say(say_someting);
                console.log('say_someting=' + say_someting);
            })();
        } else if (content.indexOf('直播间房间查询') >= 0) { // 直播间房间查询 + il_id
            sayOrquiet = true;
            console.log('直播间房间查询event！');
            (async () => {
                let il_id = content.slice(7, content.length);
                let result = await OrclUtil.executeSql('edwpool', `SELECT * FROM webcast.az_webcast_stg_room sr where sr.il_id=\'${il_id}\'`);
                console.log(result.rows);
                if (result.rows.length > 0) {
                    say_someting = '此房间数据如下' + '：\r\nil_id=' + result.rows[0][0]
                        + '\r\nesm_id=' + result.rows[0][1] + '\r\naz_account=' + result.rows[0][4]
                        + '\r\nname=' + result.rows[0][3] + '\r\nbegin_live_time=' + result.rows[0][10]
                        + '\r\nend_live_time=' + result.rows[0][8];
                } else {
                    say_someting = '无此房间数据';
                }
                await contact_for_say.say(say_someting);
                console.log('say_someting=' + say_someting);
            })();
        } else if(content.indexOf('员工查询') >= 0) {
            sayOrquiet = true;
            console.log('员工查询event！');
            (async () => {
                let prid = content.slice(4, content.length).toUpperCase();
                let result = await OrclUtil.executeSql('edwpool', `select * from publish.az_mdm_employee_master t where t.prid = \'${prid}\'`);
                console.log(result.rows);
                if (result.rows.length > 0) {
                    say_someting = prid + '员工数据如下：\r\n' + "Chinese Name：" + result.rows[0][0] + '\r\n' +
                        'Birthday：' + result.rows[0][5] + '\r\n' + 'Email：' + result.rows[0][33] + '\r\n' +
                        'ESM_USER_TYPE：' + result.rows[0][153] + '\r\n' + 'ESM_BU：' + result.rows[0][155] + '\r\n' +
                        'ManagerPrid：' + result.rows[0][156];
                } else {
                    say_someting = prid + ' 无此员工或非内部员工';
                }
                await contact_for_say.say(say_someting);
                console.log('say_someting=' + say_someting);
            })();
        } else if(content === '天气预报') {
            console.log('天气预报event！');
            sayOrquiet = true;
            let weather = await sihuo.getWeather();
            say_someting = '今日天气\r\n' + weather.weatherTips +'\r\n' +weather.todayWeather;
            await contact_for_say.say(say_someting)
        } else {
            sayOrquiet = false;
        }

        console.log('sayOrquiet=' + sayOrquiet);
    })
    .on('login',   onLogin)
    .on('logout',  onLogout)
    .start()
    .then(() => console.log('开始登陆微信'))
    .catch(e => console.error(e));