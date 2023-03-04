const Sequelise = require('sequelize');

module.exports = (database) => {
    return database.define('subjects', {
        subject: "VARCHAR(20) UNIQUE NOT NULL"
    });
}