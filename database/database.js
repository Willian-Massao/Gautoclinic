const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const openDb = async () => {
  return open({
    filename: "./database/database.db",
    driver: sqlite3.Database,
  });
}

module.exports = { openDb };