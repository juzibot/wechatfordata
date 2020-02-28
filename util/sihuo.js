const cheerio = require('cheerio');
const superagent = require('superagent');

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

module.exports ={
    getOne,getWeather
};
