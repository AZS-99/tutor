module.exports = (Sequelize, database) => {
    return database.define("pupils", {
        id: {
            type: "INT REFERENCES users(id)",
            primaryKey: true
        },
        grade: "INT CHECK(grade BETWEEN 1 AND 12)"
    }, {
        freezeTableName: true
    })
}