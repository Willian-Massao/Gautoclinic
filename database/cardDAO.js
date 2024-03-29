const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists cards (
                id INT NOT NULL AUTO_INCREMENT,
                idUser INT NOT NULL,
                number INT NOT NULL,
                PRIMARY KEY (id))`;
            await conn.query(sql);
            console.log("Tabela cards criada com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(cards){
        const conn = await pool.getConnection();
        try{
            const sql = "insert into cards (idUser, number) values (?,?)"
            await conn.query(sql, [cards.idUser, cards.number])
            console.log("cards inserido com sucesso!");
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
            const sql = `SELECT * FROM cards WHERE id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // update
    async update(cards){
        const conn = await pool.getConnection();
        try {
            const sql = `UPDATE cards SET idUser = ? number = ? WHERE id = ?`;
            await conn.query(sql, [cards.idUser, cards.number, cards.id]);
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
            const sql = `SELECT * FROM cards`;
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
            const sql = `DELETE FROM cards WHERE id = ?`;
            const [row] = await conn.query(sql, [id]);
            return row;
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