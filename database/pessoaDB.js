const pool = require("./database");
module.exports = class pessoa{
    // criar tabela
    async createTable(){
        const conn = await pool.getConnection();
        try {
            const sql = `CREATE TABLE IF NOT exists user (
                id INT NOT NULL AUTO_INCREMENT,
                email VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                end VARCHAR(255) NOT NULL,
                tel VARCHAR(255) NOT NULL,
                cpf VARCHAR(255) NOT NULL,
                admin TINYINT NOT NULL,
                password VARCHAR(255) NOT NULL,
                salt VARCHAR(255) NOT NULL,
                PRIMARY KEY (id),
                UNIQUE INDEX id_UNIQUE (id ASC) VISIBLE,
                UNIQUE INDEX email_UNIQUE (email ASC) VISIBLE)`;
            await conn.query(sql);
            console.log("Tabela user criada com sucesso!");
        } catch (err) {
            console.log(err);
            conn.release();
        } finally {
            conn.release();
        }
    }



    // crud

    // create
    async insertPessoa(pessoa){
        const conn = await pool.getConnection();
        try {
            const sql = "insert into user (name, email, end, cpf, tel, admin, password, salt) values (?,?,?,?,?,0,?,?)"
            await conn.query(sql, [pessoa.name, pessoa.email, pessoa.end, pessoa.cpf, pessoa.tel, pessoa.password, pessoa.salt])
            console.log("Pessoa inserida com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }


    // read
    async findPessoaByEmail(email){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM user WHERE email = ?`;
            const [rows] = await conn.query(sql, [email]);
            return rows[0];
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    async findPessoaById(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM user WHERE id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    async executeQuery(query){
        const conn = await pool.getConnection();
        try {
            const sql = query;
            const [rows] = await conn.query(sql);
            return rows;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // update
    async updatePessoa(pessoa){
        const conn = await pool.getConnection();
        try {
            const sql = `UPDATE user SET name = ?,email = ?,end = ?,cpf = ?,tel = ?,admin = ? WHERE id = ?`;
            await conn.query(sql, [pessoa.name, pessoa.email, pessoa.end, pessoa.cpf, pessoa.tel, pessoa.admin, pessoa.id]);
            console.log("Pessoa atualizada com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // delete
    async deletePessoa(id){
        const conn = await pool.getConnection();
        try{
            const sql = 'delete from user where id = ?';
            await conn.query(sql, [id]);
            console.log("Pessoa deletada com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }
}