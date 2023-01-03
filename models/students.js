module.exports = (Sequelize, database) => {
    return database.define("students", {
        id: {
            type: "INT REFERENCES users(id)",
            primaryKey: true
        },
        grade: "INT CHECK(grade BETWEEN 1 AND 12)",
        half_hrs_credit: "INT CHECK(half_hrs_credit >= 0) DEFAULT 0"
    }, {
        freezeTableName: true
    })
}