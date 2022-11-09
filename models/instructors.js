module.exports = (Sequelise, database) => {
    return database.define('instructors', {
        id: {
          type: "INT REFERENCES users(id)",
          primaryKey: true
        },
        hourly_rate: "INT NOT NULL CHECK(hourly_rate > 0)"
    }, {
        freezeTableName: true
    });
}