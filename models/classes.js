const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define('classes', {
        id: {
            type: "INT REFERENCES appointments(id) ON DELETE CASCADE",
            primaryKey: true
        },
        subject_id: {
            type: "INT REFERENCES subjects(id)",
            allowNull: false
        },
        topic: Sequelise.STRING,
        details: Sequelise.TEXT
    }, {
        freezeTableName: true
    })
}