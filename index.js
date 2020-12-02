const JSSoup = require("jssoup").default;
const axios = require("axios").default;

const BASE_URL = "https://movies.yahoo.com.tw";
const SUB_URL = "/movie_intheaters.html";
const COMMING_SOON_URL = "/movie_comingsoon.html";
const MOVIE_THISWEEK = "/movie_thisweek.html";
const QUERY_STRING = "?page=";

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

function getMovieTrailer(soup) {
  return soup.find("ul", "trailer_list").find("a", "gabtn").attrs["href"];
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
  const movieTrailers = [];
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
    movieTrailers.push(getMovieTrailer(soup));
  }

  return {
    movieImgSrc,
    movieGenre,
    movieRuntime,
    movieImdbRating,
    movieDirector,
    movieActors,
    movieTrailers,
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
      trailer: moviesObj.movieTrailers[i],
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

// getMovies(
//   BASE_URL,
//   MOVIE_THISWEEK,
//   QUERY_STRING,
//   "1",
//   getMovieIntroduction
// ).then((res) => {
//   console.log(res);
// });

module.exports = {
  BASE_URL,
  SUB_URL,
  COMMING_SOON_URL,
  MOVIE_THISWEEK,
  QUERY_STRING,
  getMovies,
  getMovieIntroduction,
};
