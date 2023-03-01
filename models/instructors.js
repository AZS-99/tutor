const Sequelise = require('sequelize')
module.exports = (database) => {
    return database.define('instructors', {
        id: {
          type: "INT REFERENCES users(id) ON DELETE CASCADE",
          primaryKey: true
        },
        hourly_rate: "INT NOT NULL CHECK(hourly_rate > 0)"
    }, {
        freezeTableName: true
    });
}