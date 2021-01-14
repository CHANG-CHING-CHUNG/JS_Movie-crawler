const dbController = require("./dbController");

const JSSoup = require("jssoup").default;
const axios = require("axios").default;

const BASE_URL = "https://movies.yahoo.com.tw";
const MOVIE_INTHEATERS = "/movie_intheaters.html";
const COMMING_SOON_URL = "/movie_comingsoon.html";
const MOVIE_THISWEEK = "/movie_thisweek.html";
const QUERY_STRING = "?page=";
const FUTURE = "future";
const CURRENT = "current";

async function getMovieHtml(BASE_URL, SUB_URL, QUERY_STRING, pageNumber) {
  const result =
    pageNumber && QUERY_STRING
      ? await axios.get(BASE_URL + SUB_URL + QUERY_STRING + pageNumber)
      : await axios.get(BASE_URL + SUB_URL);
  const html = await result.data;
  return html;
}

function getMovieName(soup) {
  const divs = soup.findAll("div", "release_movie_name");
  const movieNameArr = [];
  for (let tag of divs) {
    movieNameArr.push(
      tag.nextElement.text.replace(/(&amp;)/gi, " & ").replace(/\n( )+/gi, "")
    );
  }
  return movieNameArr;
}

function getReleaseDate(soup) {
  const movieReleaseDate = [];
  const divs = soup.findAll("div", "release_movie_time");
  for (let div of divs) {
    movieReleaseDate.push(div.text.match(/([0-9]{4})-[0-9]{2}-[0-9]{2}/)[0]);
  }
  const newMovieReleaseDate = movieReleaseDate.map((date) => {
    return new Date(date).getTime();
  });
  return newMovieReleaseDate;
}

function getMovieIntroduction(soup) {
  const movieIntroductionArr = [];
  const spans = soup.findAll("div", "release_text");
  for (let span of spans) {
    movieIntroductionArr.push(span.nextElement.attrs["data-url"]);
  }
  return movieIntroductionArr;
}

function getMovieNameDateInTroduction(soup) {
  const movieNameArr = getMovieName(soup);
  const movieReleaseDateArr = getReleaseDate(soup);
  const movieIntroductionArr = getMovieIntroduction(soup);
  const movieStories = getMovieStore(soup);

  return {
    movieNames: movieNameArr,
    movieDates: movieReleaseDateArr,
    movieStories: movieStories,
  };
}

function getMovieStore(soup) {
  const movieStories = [];
  const divs = soup.findAll("div", "release_text");
  for (let span of divs) {
    movieStories.push(
      span.nextElement.text.replace(/[(&nbsp;) | (&hellip;)]+/g, "")
    );
  }
  return movieStories;
}

function getMovieGenre(soup) {
  return soup
    .find("div", "level_name_box")
    .findAll("div", "level_name")
    .map((tag) => {
      return tag.nextElement.attrs["data-ga"]
        .replace(/[\[|\]]/g, "")
        .split(",")
        .slice(2)[0];
    });
}

function getMovieImgSrc(soup) {
  return soup.find("div", "movie_intro_foto").nextElement.attrs.src;
}

function getMovieRuntime(soup) {
  return soup.find("div", "wom_movie_time") === undefined
    ? soup
        .find("div", "level_name_box")
        .nextSibling.nextSibling.text.match(/：(.*)/)[1]
    : soup
        .find("div", "level_name_box")
        .nextSibling.nextSibling.nextSibling.text.match(/：(.*)/)[1];
}

function getMovieImdbRating(soup) {
  return soup.find("div", "wom_movie_time") === undefined
    ? soup
        .find("div", "level_name_box")
        .nextSibling.nextSibling.nextSibling.nextSibling.text.match(/：(.*)/)[1]
    : soup
        .find("div", "level_name_box")
        .nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.text.match(
          /：(.*)/
        )[1];
}

function getMovieDirectorAndActors(soup) {
  const movieIntroTags = soup.findAll("div", "movie_intro_list");
  const director = movieIntroTags[0].text.replace(/\s+/g, "");
  const actors = movieIntroTags[1].text.replace(/\s+/g, "");
  return {
    director,
    actors: actors.split("、"),
  };
}

async function getMovieDetail(movieDetailLinksArr) {
  movieDetailLinksArr = movieDetailLinksArr.map((link) => {
    return link.match(/\/movieinfo_main\/.*/)[0];
  });
  const movieImgSrc = [];
  let movieGenre = [];
  const movieRuntime = [];
  const movieImdbRating = [];
  const movieDirector = [];
  const movieActors = [];
  for (let i = 0; i < movieDetailLinksArr.length; i++) {
    const SUB_LINK = movieDetailLinksArr[i];
    const sourse = await getMovieHtml(BASE_URL, SUB_LINK);
    const soup = await new JSSoup(sourse);

    movieGenre.push(getMovieGenre(soup));
    movieImgSrc.push(getMovieImgSrc(soup));

    movieRuntime.push(getMovieRuntime(soup));
    movieImdbRating.push(getMovieImdbRating(soup));
    const { director, actors } = getMovieDirectorAndActors(soup);
    movieDirector.push(director);
    movieActors.push(actors);
  }

  return {
    movieImgSrc,
    movieGenre,
    movieRuntime,
    movieImdbRating,
    movieDirector,
    movieActors,
  };
}

function organizeMoives(moviesObj) {
  const movies = [];
  for (let i = 0; i < moviesObj.movieNames.length; i++) {
    movies.push({
      name: moviesObj.movieNames[i],
      releaseDate: moviesObj.movieDates[i],
      story: moviesObj.movieStories[i],
      imgSrc: moviesObj.movieImgSrc[i],
      genre: moviesObj.movieGenre[i],
      runtime: moviesObj.movieRuntime[i],
      imdbRating: moviesObj.movieImdbRating[i],
      director: moviesObj.movieDirector[i],
      actors: moviesObj.movieActors[i],
      trailer: "",
      thumbnails: "",
    });
  }

  return movies;
}

async function getOrganizedMovies(movieInfo, soup) {
  const movieDetail = await getMovieDetail(movieInfo);
  const movieNameDateIntro = getMovieNameDateInTroduction(soup);
  const Movie = {
    ...movieNameDateIntro,
    ...movieDetail,
  };
  const finalResult = organizeMoives(Movie);
  return finalResult;
}

async function getPageNumber(BASE_URL, SUB_URL, QUERY_STRING, pageNumber) {
  const sourse = await getMovieHtml(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    pageNumber
  );
  const soup = await new JSSoup(sourse);

  const li = soup.find("div", "page_numbox").nextElement.findAll("li");

  const PREVTXT = "prevtxt";
  const NEXTTXT = "nexttxt";
  const CLASS = "class";
  let startIdx;
  let endIdx;
  li.forEach((item, i) => {
    if (CLASS in item.attrs) {
      if (item.attrs.class.search(PREVTXT) != -1) startIdx = i + 1;
      if (item.attrs.class.search(NEXTTXT) != -1) endIdx = i;
    }
  });
  const pageArr = li.slice(startIdx, endIdx).map((item) => item.text);
  return pageArr;
}

async function htmlParser(
  BASE_URL,
  SUB_URL,
  QUERY_STRING,
  pageNumber,
  callBack
) {
  const sourse = await getMovieHtml(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    pageNumber
  );
  const soup = await new JSSoup(sourse);
  const movieInfo = callBack(soup);
  const organizedMovies = await getOrganizedMovies(movieInfo, soup);
  return organizedMovies;
}

async function getMovies(
  BASE_URL,
  SUB_URL,
  QUERY_STRING,
  pageNumber,
  callBack
) {
  const movies = await htmlParser(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    pageNumber,
    callBack
  );
  return Promise.resolve(movies);
}

async function getSingleLatestMovie(
  BASE_URL,
  SUB_URL,
  QUERY_STRING,
  pageNumber,
  callBack
) {
  const result = await getMovies(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    pageNumber,
    callBack
  ).then((res) => {
    return res;
  });
  return result.sort((a, b) => a.releaseDate < b.releaseDate)[0];
}

async function getLatestReleaseDate(SUB_URL, type, pageNumber) {
  const latestMovie = await getSingleLatestMovie(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    pageNumber,
    getMovieIntroduction
  );
  const dbLatestMovie = await dbController.getOneLatestMovie(type);
  return {
    releaseDateFromYahoo: latestMovie.releaseDate,
    releaseDateFromDb: dbLatestMovie[0].releaseDate,
  };
}

async function getMoviesNow() {
  for (let i = 1; i <= pageNumber; i++) {
    await getMovies(
      BASE_URL,
      MOVIE_INTHEATERS,
      QUERY_STRING,
      i,
      getMovieIntroduction
    ).then((res) => dbController.insertMovieInTheatersToDB(res));
    console.log(i);
  }
}
async function getMoviesThisWeek() {
  for (let i = 1; i <= pageNumber; i++) {
    console.log(i);
    await getMovies(
      BASE_URL,
      MOVIE_THISWEEK,
      QUERY_STRING,
      i,
      getMovieIntroduction
    ).then((res) => dbController.insertMovieThisWeekToDB(res));
  }
}

async function shouldUpdateMovie(SUB_URL, type, pageNumber) {
  const latestMovies = await getMovies(
    BASE_URL,
    SUB_URL,
    QUERY_STRING,
    pageNumber,
    getMovieIntroduction
  ).then((res) => res.map((movie) => movie.name));
  const dbLatestMoviesInTheaters =
    type === "current"
      ? await dbController
          .getLatestTenMoviesInTheaters()
          .then((res) => res.map((movie) => movie.name))
      : type === "future"
      ? await dbController
          .getLatestTenMoviesThisWeek()
          .then((res) => res.map((movie) => movie.name))
      : [];
  const result = latestMovies.filter((movie) => {
    return !dbLatestMoviesInTheaters.includes(movie);
  });

  return result.length ? true : false;
}

async function getLatestMoviesFromYahoo(SUB_URL, type, pageNumber) {
  console.log(SUB_URL, type, pageNumber);
  if (!(await shouldUpdateMovie(SUB_URL, type, "1"))) return;
  try {
    const {
      releaseDateFromYahoo,
      releaseDateFromDb,
    } = await getLatestReleaseDate(SUB_URL, type, "1");
    console.log("release", releaseDateFromYahoo, releaseDateFromDb);
    if (releaseDateFromYahoo <= releaseDateFromDb) {
      console.log("目前沒有最新電影資料能夠更新");
      return false;
    }
    for (let i = 1; i <= pageNumber; i++) {
      console.log(SUB_URL, "page", i);
      const sortedMovies = await getMovies(
        BASE_URL,
        SUB_URL,
        QUERY_STRING,
        i,
        getMovieIntroduction
      ).then((res) => {
        return res;
      });
      const movieFromDb =
        type === "current"
          ? await dbController
              .getAllMoviesInTheaters()
              .then((res) => res.map((movie) => movie.name))
          : type === "future"
          ? await dbController
              .getAllMoviesThisweek()
              .then((res) => res.map((movie) => movie.name))
          : null;

      console.log(sortedMovies.map((movie) => movie.name));
      const sortedMoviesArr = sortedMovies.map((movie) => movie.name);
      const isDuplicate = sortedMoviesArr.filter(
        (movie) => !movieFromDb.includes(movie)
      );
      if (!isDuplicate.length) {
        console.log("資料庫已存在重覆的電影資料");
      }
      if (!sortedMovies.length) {
        console.log("目前沒有最新電影資料能夠更新");
        return false;
      }
      let result =
        type === "current"
          ? await dbController.insertMovieInTheatersToDB(sortedMovies)
          : type === "future"
          ? await dbController.insertMovieThisWeekToDB(sortedMovies)
          : null;
      if (result === null) {
        return false;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function getMoviesThisWeekFromYahoo() {
  await getLatestMoviesFromYahoo(MOVIE_THISWEEK, FUTURE, 100);
}

async function getMoviesInTheatersFromYahoo() {
  await getLatestMoviesFromYahoo(MOVIE_INTHEATERS, CURRENT, 100);
}

module.exports = {
  getMoviesThisWeekFromYahoo,
  getMoviesInTheatersFromYahoo,
};
