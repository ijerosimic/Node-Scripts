const url = "https://imdb.com/";
const puppeteer = require("puppeteer");
const db = require("mssql");

const config = {
  user: 'yngvarr',
  password: 'pass123',
  server: '(localdb)\MSSQLLocalDB',
  database: 'movies',
  port: 1433
};

const getTopListUrlAsync = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url);

      const links = await page.evaluate(() => {
        let urls = [];
        let items = document.querySelectorAll("a");
        items.forEach(item => urls.push(item.getAttribute('href')));
        urls = urls
          .filter(i => i !== null)
          .filter(i => i.includes('boxoffice'));
        return urls[0];
      });

      browser.close();
      return resolve(links);
    } catch (error) {
      console.log(error);
    }
  });
};

const getBoxOfficeDataAsync = async () => {
  return new Promise(async (resolve, reject) => {
    const topList = await getTopListUrlAsync();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${url}${topList}`);

    const data = await page.evaluate(() => {
      let home = "https://www.imdb.com";
      let body = document.body;
      let urlsAndPics = body.querySelectorAll('.posterColumn a');
      let movies = [];

      let y = 0;
      for (let i = 0; i < titles.length; i++) {
        let title = titles[i].innerText;
        movies.push({
          title,
          info: {
            starring: body.querySelectorAll('.titleColumn')[i].children[0].title,
            url: `${home}${urlsAndPics[i].getAttribute('href')}`,
            weekendGross: body.querySelectorAll('.ratingColumn')[y].innerText,
            totalGross: body.querySelectorAll('.ratingColumn')[y + 1].innerText,
            weeksAtBO: body.querySelectorAll('.weeksColumn')[i].innerText
          }
        });
        y += 2;
      }

      let boxOffice = {
        period: body.querySelector('#boxoffice > h4').innerText,
        movies
      };
      return boxOffice;
    });
    browser.close();
    return resolve(data);
  });
};

(async () => {
  const boxOffice = await getBoxOfficeDataAsync();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const m in boxOffice.movies) {
    await page.goto(boxOffice.movies[m].info.url);
    const data = await page.evaluate(movie => {
      const info = ((document.querySelector('.title_wrapper .subtext').innerText).trim()).split(' | ');
      const img = document.querySelector('.poster a').getAttribute('href');
      const reviewCounter = ((document.querySelectorAll('.titleReviewBarItem .subText')[1].innerText).trim()).split(' | ');

      movie["img"] = `https://www.imdb.com/${img}`;
      movie["year"] = document.querySelector('#titleYear').innerText.replace(/[()]/g, '');
      movie["contentRating"] = info[0];
      movie["duration"] = info[1];
      movie["genre"] = info[2];
      movie["releaseDate"] = info[3];
      movie["score"] = document.querySelector('.imdbRating > .ratingValue').innerText;
      movie["voteCount"] = document.querySelector('.imdbRating a span').innerText;
      movie["summary"] = (document.querySelector('.summary_text').innerText).trim();
      movie["directedBy"] = document.querySelectorAll('.credit_summary_item a')[0].innerText;
      movie["writers"] = document.querySelectorAll('.credit_summary_item a')[1].innerText;
      movie["metascore"] = document.querySelector('.metacriticScore span').innerText;
      movie["reviewCount"] = reviewCounter[0];
      movie["criticCount"] = reviewCounter[1];
      return movie;
    }, boxOffice.movies[m].info)
    boxOffice.movies[m].info = data;
  }
  const moviesJson = JSON.stringify(boxOffice.movies).replace(/'/g, "''");
  const query =
    `declare @json nvarchar(max) 
    set @json = N'${moviesJson}'
    Insert into boxOffice select m.*  
    FROM OPENJSON(@json)  
    WITH ( 
        title nvarchar(100) '$.title',
        info nvarchar(max) '$.info' as json
        ) as m`;

  db.connect(config, function (err) {
    if (err) console.log(err);
    let request = new db.Request();
    request.query(query, function (err, recordset) {
      if (err) console.log(err);
      console.log(recordset);
    });
  });
  browser.close();
})();