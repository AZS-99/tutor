const bcrypt = require("bcrypt");
module.exports = (Sequelise, database) => {
    return database.define('students', {
        id: {
          type: "INT PRIMARY KEY REFERENCES users(id)",
          primaryKey: true
        },
        hourly_rate: "INT NOT NULL check(hourly_rate > 0)"
    }, {
        freezeTableName: true
    });
}