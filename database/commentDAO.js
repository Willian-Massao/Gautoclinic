const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists comments (
                id INT NOT NULL AUTO_INCREMENT,
                idProduct INT NOT NULL,
                idUser INT NOT NULL,
                nameUser VARCHAR(45) NOT NULL,
                comment VARCHAR(255) NOT NULL,
                rate FLOAT NOT NULL,
                PRIMARY KEY (id))`;
            await conn.query(sql);
            console.log("Tabela comments criada com sucesso!");
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(comments){
        const conn = await pool.getConnection();
        try{
            NN(comments);
            const sql = "insert into comments (idUser, idProduct, nameUser, rate, comment) values (?,?,?,?,?)"
            await conn.query(sql, [comments.idUser, comments.idProduct, comments.nameUser, comments.rate, comments.comment])
            console.log("comments inserido com sucesso!");
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
            const sql = `SELECT * FROM comments WHERE id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // read
    async productId(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM comments WHERE idProduct = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // update
    async update(comments){
        const conn = await pool.getConnection();
        try {
            NN(comments);
            const sql = `UPDATE comments SET comment = ? rate = ? WHERE id = ?`;
            await conn.query(sql, [comments.comment, comments.rate, comments.id]);
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
            const sql = `SELECT * FROM comments`;
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
            const sql = `DELETE FROM comments WHERE id = ?`;
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