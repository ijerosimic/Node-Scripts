// const url =
//   "https://marketingplatform.google.com/about/partners/find-a-partner?utm_source=marketingplatform.google.com&utm_medium=et&utm_campaign=marketingplatform.google.com%2Fabout%2Fpartners%2F";
// const puppeteer = require("puppeteer");

// (async () => {
//   try {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto(url);

//     const titles = await page.evaluate(() => document.querySelectorAll("div.description"));

//     console.log(titles);

//     browser.close();
//   } catch (error) {
//     console.log(error);
//   }
// })();

const url = "https://plantea.com.hr/gluhac/";
const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const titles = await page.evaluate(() =>
      document.querySelectorAll("img"));
    console.log(imgs);
    browser.close();
  } catch (error) {
    console.log(error);
  }
})();