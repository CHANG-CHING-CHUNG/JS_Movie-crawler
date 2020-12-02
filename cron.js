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

async function getLatestReleaseDate() {
  const latestMovie = await getSingleLatestMovie(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    "1",
    getMovieIntroduction
  );
  const dbLatestMovie = await dbController.getOneLatestMovie();
  console.log(latestMovie.name);
  console.log(dbLatestMovie[0].name);
  return {
    releaseDateFromYahoo: latestMovie.releaseDate,
    releaseDateFromDb: dbLatestMovie[0].releaseDate,
  };
}

async function getLatestMovieFromYahoo() {
  const {
    releaseDateFromYahoo,
    releaseDateFromDb,
  } = await getLatestReleaseDate();
  try {
    if (releaseDateFromYahoo > releaseDateFromDb) {
      console.log("here");
      const result = await getMovies(
        BASE_URL,
        SUB_URL,
        QUERY_STRING,
        "1",
        getMovieIntroduction
      ).then((res) => {
        return res.filter((movie) => movie.releaseDate > releaseDateFromDb);
      });
      console.log(result.length);
      if (!result.length) {
        console.log("目前沒有最新電影資料能夠更新");
        return;
      }
      await dbController.insertMovieInTheatersToDB(result);
    } else {
      console.log("目前沒有最新電影資料能夠更新");
      return;
    }
  } catch (error) {
    console.log(error);
  }
}

getLatestMovieFromYahoo();

// dbController.getOneLatestMovie();
