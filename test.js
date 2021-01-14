const dbController = require("./dbController");

dbController
  .getAllMoviesInTheaters()
  .then((res) => console.log(res.map((movie) => movie.name)));

// dbController.findDuplicateRecords().then((res) => console.log(res));
