const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const sql = require("mssql/msnodesqlv8");
const key = "RGAPI-6854c735-fbfc-4381-92a9-5b1d04e96b70";

const getServerNames = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto("https://developer.riotgames.com/api-methods/#league-v4/GET_getChallengerLeague");
            const links = await page.evaluate(() => {
                return [...document.getElementById("execute_against_league-v4_GET_getChallengerLeague")]
                    .filter(o => o.value)
                    .map(o => o.value);
            });
            browser.close();
            return resolve(links);
        } catch (error) {
            console.log(error);
        }
    });
};

const config = {
    user: 'yngvarr',
    password: 'pass123',
    server: '(localdb)\\MSSQLLocalDB',
    driver: 'msnodesqlv8',
    port: 1433,
    database: 'LeagueData'
};
const saveLadder = async (data) => {
    try {
        sql.connect(config, function (err) {
            if (err) console.log(err);
            let request = new sql.Request();
            for (let d of data) {
                let json = d.replace(/'/g, "''");
                const query = `declare @json nvarchar(max) 
                    set @json = '${json}'
                    Insert into [RankedLadders]
                    (ServerName, TierName, LeagueID, QueueType, QueueName, Data, EntryTime)
                    select m.*, 
                    getdate() as entryTime
                    FROM OPENJSON(@json)  
                    WITH ( 
                        serverName nvarchar(5) '$.serverName',
                        tierName nvarchar(30) '$.tier',
                        leagueID nvarchar(50) '$.leagueId',
                        queueType nvarchar(20) '$.queue', 
                        queueName nvarchar(100) '$.name', 
                        data nvarchar(max) '$.entries' as json
                        ) as m`;
                request.query(query, function (err, recordset) {
                    console.log(recordset);
                    if (err) console.log(err);
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
};

(async () => {
    let servers = await getServerNames();
    let data = [];
    let leagues = ["challengerleagues", "grandmasterleagues", "masterleagues"];
    for (let server of servers) {
        for (let league of leagues) {
            data.push(await fetch(`https://${server}.api.riotgames.com/lol/league/v4/${league}/by-queue/RANKED_SOLO_5x5?api_key=${key}`)
                .then(function (response) {
                    return response.json();
                })
                .then(function (json) {
                    json.serverName = server;
                    return JSON.stringify(json);
                }));
        }
    }
    saveLadder(data);
})();