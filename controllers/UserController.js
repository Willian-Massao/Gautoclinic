const UserDAO = require('../database/UserDAO.js');

class User{
    constructor(user){
        this.email = user.email;
        this.name = user.name;
        this.hasAdmin = user.hasAdmin;
        this.id = user.id;
    }
    get(){
        const user = new UserDAO();

        return user.findId(this.id);
    }
}
module.exports = User;