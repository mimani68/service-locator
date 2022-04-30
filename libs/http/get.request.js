var https = require('https');

module.exports.get = async function (url) {
    return new Promise((resolve, reject) => {
        let body = ''
        const req = https.get(url, (res) => {
            res.on("data", chunk=>{
                body += chunk
            })
            res.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(error.message);
                };
            });
        })
        req.on("error", err=>{
            reject(err)
        })
        req.end()
    })
}