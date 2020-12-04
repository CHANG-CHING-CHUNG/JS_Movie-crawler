const cron = require("node-cron");
const {
  getMoviesThisWeekFromYahoo,
  getMoviesInTheatersFromYahoo,
} = require("./movieCrawler");
const dbController = require("./dbController");

console.log("每天23:00定時抓電影資料排程已啟動...");
cron.schedule("00 23 * * *", () => {
  console.log("running a task every day on 23:00");
  getMoviesThisWeekFromYahoo();
  getMoviesInTheatersFromYahoo();
});
