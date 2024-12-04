const UserDAO = require('../database/userDAO.js');

class User{
    constructor(user){
        this.email = user.email;
        this.name = user.name;
        this.hasAdmin = user.hasAdmin;
        this.id = user.id;
        this.hasFunc = user.hasFunc;
    }
}
module.exports = User;