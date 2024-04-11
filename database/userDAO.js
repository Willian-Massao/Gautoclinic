const { use } = require("passport");
const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists users (
                id INT NOT NULL AUTO_INCREMENT,
                name varchar(45) NOT NULL,
                email varchar(45) NOT NULL,
                lastname varchar(45) NOT NULL,
                tel varchar(45) NOT NULL,
                cpf varchar(45) NOT NULL,
                cep varchar(45) NOT NULL,
                city varchar(45) NOT NULL,
                district varchar(45) NOT NULL,
                adress varchar(45) NOT NULL,
                number varchar(45) NOT NULL,
                password varchar(255) NOT NULL,
                salt varchar(255) NOT NULL,
                PRIMARY KEY (id, cpf, email),
                KEY INDICEEMAIL (email))`;
            await conn.query(sql);
            console.log("Tabela users criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(users){
        const conn = await pool.getConnection();
        try{
            NN(users);
            const sql = "insert into users (name, email, lastname, tel, cpf, cep, city, district, adress, number, password, salt) values (?,?,?,?,?,?,?,?,?,?,?,?)"
            await conn.query(sql, [users.name, users.email, users.lastname, users.tel, users.cpf, users.cep, users.city, users.district, users.adress, users.number, users.password, users.salt])
            console.log("users inserido com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // read
    async findId(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM users WHERE id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    //findEmail
    async findEmail(email){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT US.id, US.email, US.name, US.password, US.salt, case when AD.id is not null then true else false end AS hasAdmin FROM users US left join admins AD on US.id = AD.id WHERE US.email = ?;`;
            const [rows] = await conn.query(sql, [email]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // update
    async update(users){
        const conn = await pool.getConnection();
        try {
            NN(users);
            const sql = `UPDATE users SET name = ? email = ? lastname = ? tel = ? cpf = ? cep = ? city = ? district = ? adress = ? number = ? hasAdmin = ? WHERE id = ?`;
            await conn.query(sql, [users.name, users.email, users.lastname, users.tel, users.cpf, users.cep, users.city, users.district, users.adress, users.number, users.hasAdmin, users.id]);
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async updatePass(users){
        const conn = await pool.getConnection();
        try {
            NN(users);
            const sql = `UPDATE users SET password =?, salt =? WHERE id = ?`;
            await conn.query(sql, [users.password, users.salt, users.id]);
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    async select(){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM users`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // delete
    async delete(id){
        const conn = await pool.getConnection();
        try {
            const sql = `DELETE FROM users WHERE id = ?`;
            const [row] = await conn.query(sql, [id]);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async executeQuery(query){
        const conn = await pool.getConnection();
        try {
            const sql = query;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
}

function NN(thing){
    let objKeys = Object.keys(thing);
    objKeys.forEach((key) => {
        if(thing[key] == "" || thing[key] == null){
            throw new Error("O Campo não pode ser nulo!");
        };
    });
}