var ServiceLocator = require('./libs/service_locator/main');
var locator = new ServiceLocator();

var { get } = require('./libs/http/get.request');

var WeatherService = function (timeZone) {
    this.timeZone = timeZone;
    console.log("Service started")
};

WeatherService.prototype.showLatest = async function () {
    console.log("[TIME-ZONE]", this.timeZone)
    return await get("https://mockbin.org/requests")
};

// Register service
locator.register('com/app/serv/weather', WeatherService, ['Asia/Shanghai']);

// Resolve/User service
locator.resolve('com/app/serv/weather').showLatest()
    .then(el => {
        console.log(el)
    })
    .catch(err => {
        console.log(err)
    })

