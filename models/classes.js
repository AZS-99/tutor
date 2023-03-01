const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define('classes', {
        id: {
            type: "INT REFERENCES appointments(id) ON DELETE CASCADE",
            primaryKey: true
        },
        subject: {
            type: Sequelise.ENUM,
            values: ["ENGLISH", "MATHS", "PHYSICS", "PROGRAMMING"],
            allowNull: false
        },
        topic: Sequelise.STRING,
        details: Sequelise.TEXT
    }, {
        freezeTableName: true
    })
}