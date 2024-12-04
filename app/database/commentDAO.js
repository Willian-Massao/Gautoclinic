const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists comments (
                idUser int NOT NULL,
                idItem int NOT NULL,
                check_ref VARCHAR(32) NOT NULL,
                comment varchar(255) NOT NULL,
                rate float NOT NULL,
                name varchar(45) NOT NULL,
                PRIMARY KEY (idUser,idItem,check_ref),
                KEY \`idItem_idx\` (idItem),
                KEY \`idUser_idx\` (idUser),
                KEY \`name_idx\` (name),
                KEY \`check_ref_idx\` (check_ref),
                CONSTRAINT idItem FOREIGN KEY (idItem) REFERENCES itens (id),
                CONSTRAINT idUser FOREIGN KEY (idUser) REFERENCES users (id),
                CONSTRAINT name FOREIGN KEY (name) REFERENCES users (name),
                CONSTRAINT check_ref FOREIGN KEY (check_ref) REFERENCES transaction (check_ref))`;
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
            const sql = "insert into comments (idUser, idItem, check_ref, name, rate, comment) values (?,?,?,?,?,?)"
            await conn.query(sql, [comments.idUser, comments.idProduct, comments.check_ref, comments.name, comments.rate, comments.comment])
            console.log("comments inserido com sucesso!");
        }catch(err){
            //if do mal
            if(err.code != "ER_DUP_ENTRY"){
                console.log(err);
            }
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
            const sql = `SELECT * FROM comments WHERE idItem = ?`;
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
            const sql = `UPDATE comments SET comment = ?, rate = ? WHERE idUser = ? and idItem = ? and check_ref = ?`;
            await conn.query(sql, [comments.comment,comments.rate,comments.idUser, comments.idItem, comments.check_ref]);
            console.log("comments atualizado com sucesso!");
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
    async deleteIdItem(id){
        const conn = await pool.getConnection();
        try {
            const sql = `DELETE FROM comments WHERE idItem = ?`;
            const [row] = await conn.query(sql, [id]);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async deleteIdUser(id){
        const conn = await pool.getConnection();
        try {
            const sql = `DELETE FROM comments WHERE idUser = ?`;
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
    async describe(){
        const conn = await pool.getConnection();
        try {
            const sql = `DESCRIBE comments`;
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