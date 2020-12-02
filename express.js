const express = require("express");
const dbController = require("./controller");
const {
  BASE_URL,
  SUB_URL,
  COMMING_SOON_URL,
  MOVIE_THISWEEK,
  QUERY_STRING,
  getMovies,
  getMovieIntroduction,
} = require("./index");
const cors = require("cors");
const app = express();
const port = 3000;

// getMovies(
//   BASE_URL,
//   MOVIE_THISWEEK,
//   QUERY_STRING,
//   "2",
//   getMovieIntroduction
// ).then((res) => dbController.insertMovieThisWeekToDB(res));

app.use(cors());

app.get("/getMovieInTheaters", dbController.getMovieInTheaters);
app.get("/getMovieThisWeek", dbController.getMovieThisWeek);

app.listen(port, () => {
  console.log(
    `Example app listening at http://localhost:${port}/getMovieInTheaters`
  );
});
