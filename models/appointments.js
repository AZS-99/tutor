const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define("appointments", {
        student_id: "INT NOT NULL REFERENCES students(id)",
        instructor_id: "INT NOT NULL REFERENCES instructors(id)",
        year:  "INT NOT NULL CHECK(year > 2022)",
        month:  "INT NOT NULL CHECK(month BETWEEN 1 AND 12)",
        day:  "INT NOT NULL CHECK(day BETWEEN 1 AND 31)",
        half_hr: "INT NOT NULL CHECK(half_hr BETWEEN 0 AND 47)",
        status:{
            type: Sequelise.ENUM,
            values: ["STUDENT_MISSED", "ATTENDED", "INSTRUCTOR_MISSED", "PENDING"],
            defaultValue: "PENDING",
            allowNull: false
        },
        subject_id: {
            type: "INT REFERENCES subjects(id)",
            allowNull: false
        },
        topic: Sequelise.STRING,
        details: Sequelise.TEXT
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ["instructor_id", "year", "month", "day", "half_hr"]
            },
            {
                unique: true,
                fields: ["student_id", "year", "month", "day", "half_hr"]
            }
        ]
    });
}