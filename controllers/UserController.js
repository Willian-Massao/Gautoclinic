class User{
    constructor(user){
        this.email = user.email;
        this.name = user.name;
        this.hasAdmin = user.hasAdmin;
    }
}
module.exports = User;