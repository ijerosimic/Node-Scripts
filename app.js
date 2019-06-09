//jshint ignore: start

const url = "https://imdb.com/";
const puppeteer = require("puppeteer");

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
  })
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
      let header = body.querySelector('h1.header');
      let period = body.querySelector('#boxoffice > h4');

      let urlsAndPics = body.querySelectorAll('.posterColumn a');
      let titles = body.querySelectorAll('.titleColumn');
      let earnings = body.querySelectorAll('.ratingColumn');
      let weeksAtBoxOffice = body.querySelectorAll('.weeksColumn');
      let movies = {};

      let y = 0;
      for (let i = 0; i < titles.length; i++) {
        let title = titles[i].innerText;
        movies[title] = {
          id: i + 1,
          starring: titles[i].children[0].title,
          url: `${home}${urlsAndPics[i].getAttribute('href')}`,
          // img: urlsAndPics[i].children[0].getAttribute('src'),
          weekendGross: earnings[y].innerText,
          totalGross: earnings[y + 1].innerText,
          weeksAtBO: weeksAtBoxOffice[i].innerText
        }
        y += 2;
      }

      let boxOffice = {
        period: period.innerText,
        movies
      };
      return boxOffice;
    });
    browser.close();
    return resolve(data);
  })
};

(async () => {
  const boxOffice = await getBoxOfficeDataAsync();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const m in boxOffice.movies) {
    await page.goto(boxOffice.movies[m].url);
    const movies = boxOffice.movies;
    const data = await page.evaluate(movie => {
      const info = ((document.querySelector('.title_wrapper .subtext').innerText).trim()).split(' | ');
      const img = document.querySelector('.poster a').getAttribute('href');
      const people = document.querySelectorAll('.credit_summary_item a');
      const reviews = document.querySelectorAll('.titleReviewBarItem .subText');
      const reviewCounter = ((reviews[1].innerText).trim()).split(' | ');

      movie["img"] = `https://www.imdb.com/${img}`;
      movie["year"] = document.querySelector('#titleYear').innerText;
      movie["contentRating"] = info[0];
      movie["duration"] = info[1];
      movie["genre"] = info[2];
      movie["releaseDate"] = info[3];
      movie["score"] = document.querySelector('.imdbRating > .ratingValue').innerText;
      movie["voteCount"] = document.querySelector('.imdbRating a span').innerText;
      movie["summary"] = (document.querySelector('.summary_text').innerText).trim();
      movie["directedBy"] = people[0].innerText;
      movie["writers"] = people[1].innerText;
      movie["metascore"] = document.querySelector('.metacriticScore span').innerText;
      movie["reviewCount"] = reviewCounter[0].innerText;
      movie["criticCount"] = reviewCounter[1].innerText;
      //review counter ne radi
      return movie;
    }, movies[m])
    console.log(data);
  }
  browser.close();
})()