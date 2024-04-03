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
    async getItem(id){
        const conn = await pool.getConnection();
        try{
            const sql = `SELECT P.id, P.name, P.qtd, P.price, P.descount, P.description, P.mRate, I.id as idImage, I.image, C.id as idComment, C.rate, C.nameUser, C.comment from gauto.itens P inner join gauto.images I on I.idProduct = P.id inner join gauto.comments C on C.idProduct = P.id where P.id = ?`;
            const [rows] = await conn.query(sql, [id]);

            let temp = {
                id: rows[0].id,
                name: rows[0].name,
                qtd: rows[0].qtd,
                price: rows[0].price,
                descount: rows[0].descount,
                description: rows[0].description,
                mRate: rows[0].mRate,
                images: [],
                comments: []
            };
        
            rows.forEach((element) => {
                if(temp.images.length == 0 || temp.images[temp.images.length - 1].id != element.idImage){
                    temp.images.push({
                        id: element.idImage,
                        image: element.image
                    });
                }
        
                if(temp.comments.length == 0 || temp.comments[temp.comments.length - 1].id != element.idComment){
                    temp.comments.push({
                        id: element.idComment,
                        rate: element.rate,
                        nameUser: element.nameUser,
                        comment: element.comment
                    });
                }
            });

            return temp;
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
            conn.release();
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

    async query(query){
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