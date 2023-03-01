const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define('instructor_subjects', {
        instructor_id: {
            type: "INT REFERENCES instructors(id)",
            primaryKey: true
        },
        subject_id: {
            type: "INT REFERENCES subjects(id)",
            primaryKey: true
        }
    })
}