const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists itens (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(45) NOT NULL,
                qtd int NOT NULL DEFAULT '0',
                price float NOT NULL,
                descount float DEFAULT NULL,
                type varchar(45) NOT NULL,
                description text,
                mRate float DEFAULT '0',
                height float NOT NULL,
                width float NOT NULL,
                depth float NOT NULL,
                weight float NOT NULL,
                PRIMARY KEY (id)
              )`;
            await conn.query(sql);
            console.log("Tabela itens criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    async getItem(id){
        const conn = await pool.getConnection();
        try{
            NN(id);
            const sql = `SELECT P.id, P.name, P.qtd, P.price, P.descount, P.description, P.mRate, I.id as idImage, I.idItem as img2product, I.image, C.id as idComment, C.idItem as comment2product, C.rate, C.name, C.comment from gauto.itens P left join gauto.images I on I.idItem = P.id left join gauto.comments C on C.idItem = P.id where P.id = ?`;
            const [rows] = await conn.query(sql, [id]);
            return compac(rows)[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(itens){
        const conn = await pool.getConnection();
        try{
            NN(itens);
            const sql = "insert into itens (name ,qtd ,price ,descount ,type ,description ,mRate ,height ,width ,depth ,weight) values (?,?,?,?,?,?,?,?,?,?,?)"
            await conn.query(sql, [itens.name,itens.qtd,itens.price,itens.descount,itens.type,itens.description,itens.mRate,itens.height,itens.width,itens.depth,itens.weight])
            console.log("itens inserido com sucesso!");
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
        try{
            NN(type);
            const sql = `SELECT P.id, P.name, P.qtd, P.price, P.descount, P.description, P.mRate, I.id as idImage, I.idItem as img2product, I.image, C.id as idComment, C.idItem as comment2product, C.rate, C.name, C.comment from gauto.itens P left join gauto.images I on I.idItem = P.id left join gauto.comments C on C.idItem = P.id where P.type = ?`;
            const [rows] = await conn.query(sql, [type]);
            return compac(rows);
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // update
    async update(itens){
        const conn = await pool.getConnection();
        try {
            NN(itens);
            const sql = `UPDATE itens SET name = ? ,qtd = ? ,price = ? ,descount = ? ,type = ? ,description = ? ,mRate = ? ,height = ? ,width = ? depth = ? ,weight = ? WHERE id = ?`;
            await conn.query(sql, [itens.name,itens.qtd,itens.price,itens.descount,itens.type,itens.description,itens.mRate,itens.height,itens.width,itens.depth,itens.weight]);
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
    async search(search){
        const conn = await pool.getConnection();
        try{
            const sql = `SELECT P.id, P.name, P.qtd, P.price, P.descount, P.description, P.mRate, I.id as idImage, I.idItem as img2product, I.image, C.id as idComment, C.idItem as comment2product, C.rate, C.name, C.comment from gauto.itens P left join gauto.images I on I.idItem = P.id left join gauto.comments C on C.idItem = P.id where P.name like ?`;
            const [rows] = await conn.query(sql, ['%' + search + '%']);
            return compac(rows);
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }
    async describe(){
        const conn = await pool.getConnection();
        try {
            const sql = `DESCRIBE itens;`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
}

function compac(result){
    let temp = [];
    result.forEach((element) => {
        if(temp.length == 0 || temp[temp.length - 1].id != element.id){
            temp.push({
                id: element.id,
                name: element.name,
                qtd: element.qtd,
                price: element.price,
                descount: element.descount,
                description: element.description,
                mRate: element.mRate,
                images: [],
                comments: []
            });
        }
    });

    
    result.forEach((element) => {
        temp.forEach((newRows) => {
            if(element.img2product == newRows.id){
                if(newRows.images.length == 0 || newRows.images[newRows.images.length - 1].id != element.idImage){
                    newRows.images.push({
                        id: element.idImage,
                        image: element.image
                    });
                }
            }
        
            if(element.comment2product == newRows.id){
                if(newRows.comments.length == 0 || newRows.comments[newRows.comments.length - 1].id != element.idComment){
                    newRows.comments.push({
                        id: element.idComment,
                        rate: element.rate,
                        name: element.name,
                        comment: element.comment
                    });
                } 
            }
        });
    });
    return temp;
}

function NN(thing){
    let objKeys = Object.keys(thing);
    objKeys.forEach((key) => {
        if(thing[key] == "" || thing[key] == null){
            throw new Error("O Campo não pode ser nulo!");
        };
    });
}