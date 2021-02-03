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

async function getLatestMoviesFromYahoo(SUB_URL, type, pageNumber) {
  let pageNumberCounter = 0;
  let collectionName;
  if (type === "current") {
    collectionName = "movies";
  } else if (type === "future") {
    collectionName = "movies_thisweek";
  }
  console.log("Line 341 ", SUB_URL, type, pageNumber);
  try {
    for (let i = 1; i <= pageNumber; i++) {
      console.log("Line 344 ", SUB_URL, "page", i);
      const sortedMovies = await getMovies(
        BASE_URL,
        SUB_URL,
        QUERY_STRING,
        i,
        getMovieIntroduction
      ).then((res) => {
        return res;
      });

      let counter = 0;
      const newSortedMovies = [];
      for (let k = 0; k < sortedMovies.length; k++) {
        const movieFromDb = await dbController.getMovieByName(
          sortedMovies[k].name,
          "movies"
        );
        console.log(movieFromDb);
        if (movieFromDb != null && sortedMovies[k].name === movieFromDb.name) {
          console.log(`該電影 ${sortedMovies[k].name}已存在於資料庫了!`);
        } else {
          newSortedMovies.push(sortedMovies[k]);
          console.log(`資料庫並無電影 ${sortedMovies[k].name}`);
          console.log(`將電影 ${sortedMovies[k].name} 加入資料庫`);
          counter++;
        }
      }
      console.log("Line 371 newSortedMovies array");
      console.log(
        "counter " +
          counter +
          " newSortedMovies.length " +
          newSortedMovies.length
      );

      if (newSortedMovies.length) {
        const result =
          type === "current"
            ? await dbController.insertMovieInTheatersToDB(newSortedMovies)
            : type === "future"
            ? await dbController.insertMovieThisWeekToDB(newSortedMovies)
            : null;
        pageNumberCounter = 0;
      } else {
        console.log("沒有電影要被加入到資料庫");
        pageNumberCounter++;
      }
      if (pageNumberCounter === 3) {
        return;
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
