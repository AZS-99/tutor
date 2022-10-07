const bcrypt = require('bcrypt')

module.exports = (Sequelise, database) => {
    return database.define('users', {
        forename: {
            type: Sequelise.STRING,
            validate: {
                is: {
                    args: ['^[a-z0-9]{2,20}$', 'i'],
                    msg: ['Server rejected forename']
                }
            }
        },
        surname: {
            type: Sequelise.STRING,
            validate: {
                is: {
                    args: ['^[a-z0-9]{2,20}$', 'i'],
                    msg: ['Server rejected surname']
                }
            }
        },
        email: {
            type: Sequelise.STRING,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: Sequelise.STRING,
            validate: {
                is: {
                    args: ['^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9_-]{8,30}$'],
                    msg: ['Server rejected password']
                }
            }
        }

    }, {
        hooks: {
            afterValidate: async (user, options) => {
                user.password = await bcrypt.hash(user.password, Number(process.env.SALT_ROUNDS))
            }
        },
        freezeTableName: true
    })
}


