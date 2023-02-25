module.exports = (Sequelise, database) => {
    return database.define("appointments", {
        instructor_id: "INT NOT NULL REFERENCES instructors(id) ON DELETE CASCADE",
        student_id: "INT NOT NULL REFERENCES students(id) ON DELETE CASCADE",
        subject: {
            type: Sequelise.ENUM,
            values: ["MATHS", "PHYSICS", "PROGRAMMING"],
            allowNull: false
        },
        year: {
            type: "INT NOT NULL CHECK(year > 2022)",
            unique: "uq_appointment"
        },
        month: {
            type: "INT NOT NULL CHECK(month BETWEEN 1 AND 12)",
            unique: "uq_appointment"
        },
        day: {
            type: "INT NOT NULL CHECK(day BETWEEN 1 AND 31)",
            unique: "uq_appointment"
        },
        half_hr: {
            type: "INT NOT NULL CHECK(half_hr BETWEEN 0 AND 47)",
            unique: "uq_appointment"
        },
        status:{
            type: Sequelise.ENUM,
            values: ["STUDENT_MISSED", "ATTENDED", "INSTRUCTOR_MISSED", "PENDING"],
            defaultValue: "PENDING"
        }
    }, {
        freezeTableName: true
    });
}