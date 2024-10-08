const pool  = require("./database");

module.exports  = class melhorEnvioTokens{
    // criar tabela
    async create(){
        const conn = await pool.getConnection();
        try{
            const sql = `CREATE TABLE if not exists melhorEnvioTokens (
                id INT NOT NULL AUTO_INCREMENT,
                client_id INT NOT NULL,
                client_secret varchar(40) NOT NULL,
                redirect_uri TEXT(1700) NOT NULL,
                refresh_token TEXT(1700) NOT NULL,
                access_token TEXT(1700) NOT NULL,
                expired_at TIMESTAMP NOT NULL,
                indicador_ativo BOOLEAN DEFAULT TRUE,
                PRIMARY KEY (id));`;
            await conn.query(sql);
            console.log("Tabela melhorEnvioTokens criada com sucesso!");
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }

    // insertUpdate
    async insertOrUpdate(melhorEnvioTokens){
        const conn = await pool.getConnection();
        try{
            NN(melhorEnvioTokens);
            const sql = "insert into melhorEnvioTokens (id, redirect_uri, client_id, client_secret, refresh_token, access_token, expired_at, indicador_ativo) values (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE indicador_ativo= ?"
            await conn.query(sql, [melhorEnvioTokens.id, melhorEnvioTokens.redirect_uri, melhorEnvioTokens.client_id, melhorEnvioTokens.client_secret, melhorEnvioTokens.refresh_token, melhorEnvioTokens.access_token, melhorEnvioTokens.expired_at, melhorEnvioTokens.indicador_ativo, melhorEnvioTokens.indicador_ativo])
            console.log("melhorEnvioTokens inserido/updatado com sucesso!");
        }catch(err){
            console.log(err);
            throw err;
        }finally{
            conn.release();
        }
    }
    async equalsNull(){
        const conn = await pool.getConnection();
        try{
            const sql = "select id, redirect_uri, client_id, client_secret from melhorEnvioTokens where refesh_token = null"
            const row = await conn.query(sql)
            return row;
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
            const sql = `DESCRIBE melhorEnvioTokens;`;
            const [row] = await conn.query(sql);
            return row;
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    async buscaToken(){
        const conn = await pool.getConnection();
        try{
            const sql = "select id, access_token from melhorEnvioTokens where indicador_ativo = 1;";
            const [row] = await conn.query(sql);
            return row[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    async buscaRefreshToken(){
        const conn = await pool.getConnection();
        try{
            const sql = "select * from melhorEnvioTokens where indicador_ativo = 1;";
            const [row] = await conn.query(sql);
            return row[0];
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    async alteraRefreshToken(melhorEnvioTokens){
        const conn = await pool.getConnection();
        try{
            let sql = "select id, client_id, client_secret, refresh_token, access_token, expired_at from melhorEnvioTokens where indicador_ativo = 1;";
            let [row] = await conn.query(sql);
            sql = "update melhorEnvioTokens set indicador_ativo = 0 where id = ?"
            await conn.query(sql, [row[0].id])
            sql = "insert into melhorEnvioTokens (redirect_uri, client_id, client_secret, refresh_token, access_token, expired_at, indicador_ativo) values (?,?,?,?,?,?,1)"
            await conn.query(sql, [process.env.MELHORENVIO_REDIRECT_URI,row[0].client_id,row[0].client_secret,melhorEnvioTokens.refresh_token,melhorEnvioTokens.access_token,melhorEnvioTokens.expired_at])
        }catch(err){
            console.log(err);
        }finally{
            conn.release();
        }
    }
    async desativarToken(melhorEnvioTokens){
        const conn = await pool.getConnection();
        try{
            const sql = "UPDATE melhorEnvioTokens SET indicador_ativo = 0 WHERE id = ?;";
            const [row] = await conn.query(sql, [melhorEnvioTokens.id]);
            return row[0];
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