const dbController = require("./dbController");

// dbController
//   .getAllMoviesInTheaters()
//   .then((res) => console.log(res.map((movie) => movie.name)));

dbController.findDuplicateRecords("movies_thisweek").then((res) => {
  console.log(res);
  const movieNameList = res.map((item) => {
    return item._id.name;
  });
  console.log(movieNameList);
  dbController.deleteDuplicateRecord(movieNameList, "movies");
});
