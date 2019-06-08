//jshint ignore: start

const url = "https://imdb.com/";
const puppeteer = require("puppeteer");

const getTopListUrl = async () => {
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

(async () => {
  const topList = await getTopListUrl();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // console.log(`${url}${toplist}`);
  await page.goto(`${url}${topList}`);

  const data = await page.evaluate(() => {
    let home = "https://www.imdb.com";
    let header = document.querySelector('h1.header');
    let period = document.querySelector('#boxoffice > h4');

    // let firstColumn = document.querySelectorAll('.posterColumn');
    let urlsAndPics = document.querySelectorAll('.posterColumn a');
    let titles = document.querySelectorAll('.titleColumn');
    let movies = [];

    for (let i = 0; i < titles.length; i++) {
      movies.push({
        title: titles[i].innerText,
        starring: titles[i].children[0].title,
        url: `${home}${urlsAndPics[i].getAttribute('href')}`,
        img: urlsAndPics[i].children[0].getAttribute('src'),
      })
    }

    return movies;
  });
  console.log(data);
  browser.close();
})();