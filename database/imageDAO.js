const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists images (
                id int NOT NULL AUTO_INCREMENT,
                idItem int NOT NULL,,
                image longblob NOT NULL,
                PRIMARY KEY (id),
                KEY \`id item imagem_idx\` (idItem),
                CONSTRAINT \`id item imagem\` FOREIGN KEY (idItem) REFERENCES itens (id)
              )
              `;
            await conn.query(sql);
            console.log("Tabela images criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(images){
        const conn = await pool.getConnection();
        try{
            NN(images);
            const sql = "insert into images (idItem, image) values (?,?)"
            await conn.query(sql, [images.idproduct, images.image])
            console.log("images inserido com sucesso!");
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
            const sql = `SELECT * FROM images WHERE id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // update
    async update(images){
        const conn = await pool.getConnection();
        try {
            NN(images);
            const sql = `UPDATE images SET image = ? WHERE id = ? and idItem = ?`;
            await conn.query(sql, [images.image, images.id, images.idproduct]);
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
            const sql = `SELECT * FROM images`;
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
            const sql = `DELETE FROM images WHERE id = ?`;
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