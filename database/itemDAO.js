const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists itens (
                id INT NOT NULL AUTO_INCREMENT,
                name varchar(45) NOT NULL,
                qtd INT NOT NULL DEFAULT 0,
                price FLOAT NOT NULL,
                descount FLOAT,
                type VARCHAR(45) NOT NULL,
                description TEXT,
                mRate FLOAT DEFAULT 0,
                PRIMARY KEY (id))`;
            await conn.query(sql);
            console.log("Tabela itens criada com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(itens){
        const conn = await pool.getConnection();
        try{
            const sql = "insert into itens (name, qtd, price, descount, type, description) values (?,?,?,?,?,?)"
            await conn.query(sql, [itens.name, itens.qtd, itens.price, itens.descount, itens.type, itens.description])
            console.log("itens inserido com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // read
    async findId(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM itens WHERE id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    //find by type
    async findType(type){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM itens WHERE type = ?`;
            const [rows] = await conn.query(sql, [type]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // update
    async update(itens){
        const conn = await pool.getConnection();
        try {
            const sql = `UPDATE itens SET name = ? qtd = ? price = ? descount = ? type = ? mRate = ? description = ? WHERE id = ?`;
            await conn.query(sql, [itens.name, itens.qtd, itens.price, itens.descount,itens.type, itens.mRate, itens.description, itens.id]);
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    async select(){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM itens`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // delete
    async delete(id){
        const conn = await pool.getConnection();
        try {
            const sql = `DELETE FROM itens WHERE id = ?`;
            const [row] = await conn.query(sql, [id]);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    async newRate(value){
        const conn = await pool.getConnection();
        try {
            const sql = `UPDATE itens SET mRate = ? WHERE id = ?`;
            await conn.query(sql, [value.mRate, value.id]);
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
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }
}