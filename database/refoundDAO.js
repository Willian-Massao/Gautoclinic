const pool  = require("./database");

module.exports  = class itens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists refund (
                idrefund INT NOT NULL,
                idUser INT NOT NULL,
                uuid_check_ref VARCHAR(32) NOT NULL,
                status VARCHAR(45) NOT NULL DEFAULT 'PENDING',
                PRIMARY KEY (idrefund),
                INDEX \`is user transaction_idx\` (idUser ASC) INVISIBLE,
                INDEX \`check_ref uuid\` (uuid_check_ref ASC) INVISIBLE,
                CONSTRAINT \`is user transaction_idx\`
                  FOREIGN KEY (idUser)
                  REFERENCES gauto.users (id)
                  ON DELETE NO ACTION
                  ON UPDATE NO ACTION,
                CONSTRAINT \`check_ref uuid\`
                  FOREIGN KEY (uuid_check_ref)
                  REFERENCES gauto.transaction (id)
                  ON DELETE NO ACTION
                  ON UPDATE NO ACTION)`;
            await conn.query(sql);
            console.log("Tabela refund criada com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }

    // crud

    // create
    async insert(refund){
        const conn = await pool.getConnection();
        try{
            NN(refund);
            const sql = "insert into refund (idUser, uuid_check_ref, status) values (?,?,?)"
            await conn.query(sql, [refund.idUser, refund.uuid_check_ref, refund.status])
            console.log("refund inserido com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // read
    async findId(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM refund WHERE uuid_check_ref = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async findUser(id){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM refund WHERE idUser = ?`;
            const [rows] = await conn.query(sql, [id]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    async like(refund){
        const conn = await pool.getConnection();
        try {
            const sql = `SELECT * FROM refund WHERE uuid_check_ref LIKE ? and idUser = ?`;
            const [rows] = await conn.query(sql, [`${refund.check_ref}%`, refund.idUser]);
            return rows;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }


    // update
    async update(refund){
        const conn = await pool.getConnection();
        try {
            NN(refund);
            const sql = `UPDATE refund SET status = ? WHERE idrefund = ?`;
            await conn.query(sql, [refund.status, refund.id]);
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
            const sql = `SELECT * FROM refund`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
            conn.release();
        }finally{
            conn.release();
        }
    }
    async describe(){
        const conn = await pool.getConnection();
        try {
            const sql = `DESCRIBE refund`;
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