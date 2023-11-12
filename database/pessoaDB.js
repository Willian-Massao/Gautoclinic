const { openDb } = require("./database");

module.exports = class pessoa{
    // criar tabela
    async createTable(){
        openDb().then(db=>{
            db.exec(`create table if not exists user (
                id integer PRIMARY KEY autoincrement not null,
                email varchar(255) not null,
                name varchar(255) not null,
                end varchar(255) not null,
                tel varchar(255) not null,
                cpf varchar(255) not null,
                admin boolean not null,
                password varchar(255) not null,
                salt varchar(255),
                UNIQUE (id, email)
            )`)
            .then(err => {
                console.log("Tabela user criada com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }

    // crud

    // create
    async insertPessoa(pessoa){
        openDb().then(db=>{
            db.exec(`insert into user (name, email, end, cpf, tel, admin, password, salt) values 
            ('${pessoa.name}',
            '${pessoa.email}',
            '${pessoa.end}',
            '${pessoa.cpf}',
            '${pessoa.tel}',
            0,
            '${pessoa.password}',
            '${pessoa.salt}')`)
            .then(err => {
                console.log("Pessoa inserida com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }


    // read
    async findPessoaByEmail(email){
        try {
            var db = await openDb();
            var result = await db.get(`SELECT * FROM "user" WHERE "email" = '${email}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    async findPessoaById(id){
        try {
            var db = await openDb();
            var result = await db.get(`SELECT * FROM "user" WHERE "id" = ${id}`);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    async executeQuery(query){
        try {
            var db = await openDb();
            var result = await db.all(query);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    // update
    async updatePessoa(pessoa){
        openDb().then(db=>{
            db.get(`update user set name = '${pessoa.name}',
            email = '${pessoa.email}',
            end = '${pessoa.end}',
            cpf = '${pessoa.cpf}',
            tel = '${pessoa.tel}',
            admin = '${pessoa.admin} '
            where id = '${pessoa.id}'`)
            .then(row =>{
                console.log(row);
                return row;
            })
        })
    }

    // delete
    async deletePessoa(id){
        openDb().then(db=>{
            db.get(`delete from user where id = '${id}'`)
            .then(row =>{
                console.log(row);
                return row;
            })
        })
    }
}