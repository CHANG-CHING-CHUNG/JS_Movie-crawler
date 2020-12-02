const express = require("express");
const dbController = require("./dbController");
const {
  BASE_URL,
  SUB_URL,
  COMMING_SOON_URL,
  MOVIE_THISWEEK,
  QUERY_STRING,
  getMovies,
  getSingleLatestMovie,
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

async function compareReleaseDate() {
  const latestMovie = await getSingleLatestMovie(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    "2",
    getMovieIntroduction
  );

  const dbLatestMovie = await dbController.getOneLatestMovie();
  console.log(
    new Date(latestMovie.releaseDate).toLocaleString(),
    new Date(dbLatestMovie[0].releaseDate).toLocaleString()
  );
  console.log(latestMovie.releaseDate < dbLatestMovie[0].releaseDate);
}

compareReleaseDate();

app.use(cors());

app.get("/getMovieInTheaters", dbController.getMovieInTheaters);
app.get("/getMovieThisWeek", dbController.getMovieThisWeek);
// app.get("/getOneLatestMovie", dbController.getOneLatestMovie);

app.listen(port, () => {
  console.log(
    `Example app listening at http://localhost:${port}/getMovieInTheaters`
  );
});
