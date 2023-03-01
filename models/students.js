const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define("students", {
        id: {
            type: "INT REFERENCES users(id) ON DELETE CASCADE",
            primaryKey: true
        },
        grade: "INT CHECK(grade BETWEEN 1 AND 12)",
        half_hrs_credit: "INT CHECK(half_hrs_credit >= 0) DEFAULT 2"
    }, {
        freezeTableName: true
    })
}