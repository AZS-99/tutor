module.exports = (Sequelise, database) => {
    return database.define('images', {
        id: {
            type: Sequelise.INTEGER,
            primaryKey: true
        },
        page: {
            type: Sequelise.STRING,
            primaryKey: true
        },
        img: {type: 'bytea'}
    })
}