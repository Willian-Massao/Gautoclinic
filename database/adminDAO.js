const pool  = require("./database");

module.exports  = class admins{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists admins (
                id INT NOT NULL AUTO_INCREMENT,
                idUser BOOLEAN NOT NULL,
                name varchar(45) NOT NULL,
                PRIMARY KEY (id))`;
            await conn.query(sql);
            console.log("Tabela admins criada com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(admins){
        const conn = await pool.getConnection();
        try{
            NN(admins);
            const sql = "insert into admins (idUser, name) values (?,?)"
            await conn.query(sql, [admins.idUser, admins.name])
            console.log("admins inserido com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // read
    async findIdUser(){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT users.id, users.name FROM users LEFT JOIN admins ON users.id = admins.idUser`;
            const [rows] = await conn.query(sql);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // update
    async update(admins){
        const conn = await pool.getConnection();
        try {
            NN(admins);
            const sql = `UPDATE admins SET name = ? idUser = ? WHERE id = ?`;
            await conn.query(sql, [admins.name, admins.idUser, admins.id]);
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
            const sql = `SELECT * FROM admins`;
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
            const sql = `DELETE FROM admins WHERE id = ?`;
            const [row] = await conn.query(sql, [id]);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async query(query){
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