const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async createTable(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists item (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                price INT NOT NULL,
                image VARCHAR(255) NOT NULL,
                section VARCHAR(255) NOT NULL,
                description VARCHAR(255) NOT NULL,
                userId VARCHAR(255) NOT NULL,
                PRIMARY KEY (id))`;
            await conn.query(sql);
            console.log("Tabela item criada com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insertItem(item){
        const conn = await pool.getConnection();
        try{
            const sql = "insert into item (name, price, image, section, description, userId) values (?,?,?,?,?,?)"
            await conn.query(sql, [item.name, item.price, item.image, item.section, item.description, item.userId])
            console.log("Item inserido com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // read
    async findItemById(id){
        try {
            var db = await pool();
            var result = await db.get(`SELECT * FROM item WHERE id = '${id}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }
    // update
    async updateItem(item){
        const conn = await pool.getConnection();
        try {
            const sql = `UPDATE item SET name = ?, price = ?, image = ?, section = ?, description = ?, userId = ? WHERE id = ?`;
            const [row] = await conn.query(sql, [item.name, item.price, item.image, item.section, item.description, item.userId, item.id]);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    async findItemAll(){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM item`;
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
    async deleteItem(id){
        const conn = await pool.getConnection();
        try {
            const sql = `DELETE FROM item WHERE id = ?`;
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

    async findItemBySection(section){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM item WHERE section = ?`;
            const [row] = await conn.query(sql, [section]);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    async findItemByUserId(userId){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT description, image, price FROM item WHERE userId = ?`;
            const [row] = await conn.query(sql, [userId]);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }
}