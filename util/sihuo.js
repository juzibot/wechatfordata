const cheerio = require('cheerio');
const superagent = require('superagent');
require('superagent-proxy')(superagent);  // 引入SuperAgent-proxy
const xpath = require('xpath');
const htmlparser2 = require("htmlparser2");
const DomHandler = require("domhandler");
const agent = superagent.agent(); // 保持session
let iniParser = require('iniparser');
let config = iniParser.parseSync('./resource/config.ini');
let proxy =  config['COMMON']['proxy'];

async function getOne() { // 获取每日一句
    let res = await req('http://wufazhuce.com/','GET')
    let $ = cheerio.load(res.text)
    let todayOneList = $('#carousel-one .carousel-inner .item')
    return $(todayOneList[0]).find('.fp-one-cita').text().replace(/(^\s*)|(\s*$)/g, "");
}

async function getWeather() { //获取墨迹天气
    let url = 'https://tianqi.moji.com/weather/china/'+'liaoning'+'/'+'dalian';
    let res = await req(url,'GET');
    let $ = cheerio.load(res.text);
    let weatherTips = $('.wea_tips em').text();
    const today = $('.forecast .days').first().find('li');
    let todayInfo = {
        Day:$(today[0]).text().replace(/(^\s*)|(\s*$)/g, ""),
        WeatherText:$(today[1]).text().replace(/(^\s*)|(\s*$)/g, ""),
        Temp:$(today[2]).text().replace(/(^\s*)|(\s*$)/g, ""),
        Wind:$(today[3]).find('em').text().replace(/(^\s*)|(\s*$)/g, ""),
        WindLevel:$(today[3]).find('b').text().replace(/(^\s*)|(\s*$)/g, ""),
        PollutionLevel:$(today[4]).find('strong').text().replace(/(^\s*)|(\s*$)/g, "")
    };
    return  {
        weatherTips: weatherTips,
        todayWeather: todayInfo.Day + ':' + todayInfo.WeatherText + '\r\n' + '温度:' + todayInfo.Temp + '\r\n'
            + todayInfo.Wind + todayInfo.WindLevel + '\r\n' + '空气:' + todayInfo.PollutionLevel + '\r\n'
    }
}

//请求
function req(url,method, params, data, cookies) {
    return new Promise(function (resolve,reject) {
        superagent(method, url)
            .query(params)
            .proxy(proxy)
            .send(data)
            .set('Content-Type','application/x-www-form-urlencoded')
            .end(function (err, response) {
                if (err) {
                    reject(err)
                }
                resolve(response)
            })
    })
}

//请求
function reqForLogin(url,method, data, cookies) {
    return new Promise(function (resolve,reject) {
        agent.post(url)
            .send(data)
            .set('Content-Type','application/x-www-form-urlencoded')
            .end(function (err, response) {
                if (err) {
                    reject(err)
                }
                resolve(response)
            })
    })
}

function closeHTML(str){
    let arrTags=["META","base","link","span","font","b","u","i","h1","h2","h3","h4","h5","h6","p","li","ul","table","div"];
    for(let i=0;i<arrTags.length;i++){
        let intOpen=0;
        let intClose=0;
        let re=new RegExp("\\<"+arrTags[i]+"( [^\\<\\>]+|)\\>","ig");
        let arrMatch=str.match(re);
        if(arrMatch!=null) intOpen=arrMatch.length;
        re=new RegExp("\\<\\/"+arrTags[i]+"\\>","ig");
        arrMatch=str.match(re);
        if(arrMatch!=null) intClose=arrMatch.length;
        for(let j=0;j<intOpen-intClose;j++){
            str+="</"+arrTags[i]+">";
        }
        /*for(var j=(intOpen-intClose-1);j>=0;j--){
        str+="</"+arrTags[i]+">";
        }*/
    }
    return str;
}

module.exports ={
    getOne,getWeather
};


(async (str, type) => {
    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        // application specific logging, throwing an error, or other logic here
    });
    let post_data = {
        "cmsName": config['DS']['ds_cmsName'],
        "userName": config['DS']['ds_user'],
        "password": config['DS']['ds_password'],
        "authType": "secEnterprise",
        "cmsVisible": "true",
        "isFromLogonPage": "true",
        "sessionCookie": "true",
        "persistCookies": "true",
        "service": "/admin/App/appService.jsp",
        "formAction": "logon"
    };
    // 登陆验证
    let res = await reqForLogin(`http://` + config['DS']['proxy'] + `/DataServices/launch/logon`,'POST', post_data);
    // Repo List
    res = await reqForLogin(`http://` + config['DS']['proxy'] + `/DataServices/servlet/AwHome`,'GET', post_data);
    // console.log(res.text);
    // let doc = new DOMParser({
    //     locator:{},
    //     errorHandler:{warning:function(w){console.warn(w)}}
    // }).parseFromString(closeHTML(res.text), type);
    const handler = new DomHandler(function(error, dom) {
        if (error) {
            // Handle error
        } else {
            // Parsing completed, do something
            console.log(dom);
        }
    });
    const parser = new htmlparser2(handler);
    let doc = parser.write(res.text);
    parser.end();
    console.log(doc);
    let XPATH_REPO_LIST = "//tr[@class='tableRow'][*]/td[@class='cell'][1]/a";
    let repoListNodes = xpath.select(XPATH_REPO_LIST, doc);
    console.log(repoListNodes);
    for (let i = 0;i < repoListNodes.length;i++) {
        console.log(console.log(repoListNodes[i].nodeValue));
    }
})();