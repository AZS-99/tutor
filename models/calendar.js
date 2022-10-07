module.exports = (Sequelize, database) => {
    return database.define("appointments", {
        instructor_id: "INT NOT NULL REFERENCES users(id)",
        student_id: "INT NOT NULL REFERENCES users(id)",
        start_time: Sequelize.timestamp,
        end_time: Sequelize.timestamp,

    });
}