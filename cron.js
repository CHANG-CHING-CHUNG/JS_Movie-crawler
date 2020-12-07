const cron = require("node-cron");
const {
  getMoviesThisWeekFromYahoo,
  getMoviesInTheatersFromYahoo,
} = require("./movieCrawler");
const dbController = require("./dbController");

console.log("每天23:00定時抓電影資料排程已啟動...");
cron.schedule("00 23 * * *", async () => {
  console.log("抓電影開始");
  await getMoviesThisWeekFromYahoo();
  await getMoviesInTheatersFromYahoo();
  console.log("抓電影結束");
});
