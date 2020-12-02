const { MongoClient } = require("mongodb");
const url = require("./dbConnector");
const dbName = "test";

const dbController = {
  async insertMovieInTheatersToDB(moviesDocument) {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    try {
      await client.connect();
      console.log("Connected correctly to server");
      const db = client.db(dbName);

      const col = db.collection("movies");

      const options = { ordered: true };
      const result = await col.insertMany(moviesDocument, options);
      console.log(`${result.insertedCount} documents were inserted`);
    } catch (err) {
      console.log(err.stack);
    } finally {
      // await client.close();
    }
  },
  async insertMovieThisWeekToDB(moviesDocument) {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    try {
      await client.connect();
      console.log("Connected correctly to server");
      const db = client.db(dbName);

      const col = db.collection("movies");

      const options = { ordered: true };
      const result = await col.insertMany(moviesDocument, options);
      console.log(`${result.insertedCount} documents were inserted`);
    } catch (err) {
      console.log(err.stack);
    } finally {
      // await client.close();
    }
  },
  async getMovieInTheaters(req, res) {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    try {
      await client.connect();
      const db = client.db(dbName);
      const col = db.collection("movies");
      const options = {
        sort: { releaseDate: -1 },
      };
      const cursor = col.find(null, options);
      // print a message if no documents were found
      if ((await cursor.count()) === 0) {
        console.log("No documents found!");
      }
      res.json(await cursor.toArray());
    } finally {
      await client.close();
    }
  },
  async getMovieThisWeek(req, res) {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    try {
      await client.connect();
      const db = client.db(dbName);
      const col = db.collection("movies_thisweek");
      const cursor = col.find();
      // print a message if no documents were found
      if ((await cursor.count()) === 0) {
        console.log("No documents found!");
      }
      res.json(await cursor.toArray());
    } finally {
      await client.close();
    }
  },
};

module.exports = dbController;
