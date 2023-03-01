const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define('admins', {
        id: {
            type: "INT REFERENCES users(id)",
            primaryKey: true
        }
    })
}