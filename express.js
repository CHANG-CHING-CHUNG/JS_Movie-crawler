const express = require("express");
const dbController = require("./dbController");
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
// app.get("/getOneLatestMovie", dbController.getOneLatestMovie);

app.listen(port, () => {
  console.log(
    `Example app listening at http://localhost:${port}/getMovieInTheaters`
  );
});
