const sqlite3 = require("sqlite3");
const { openDb } = require("./database");

module.exports  = class itens{
    // criar tabela
    async createTable(){
        openDb().then(db=>{
            db.exec(`create table if not exists item (
                id integer primary key autoincrement not null,
                name varchar(255) not null,
                price int(255) not null,
                image varchar(255),
                section varchar(255) not null,
                description varchar(255) not null,
                userId int not null
            )`)
            .then(err => {
                console.log("Tabela item criada com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }

    // crud

    // create
    async insertItem(item){
        openDb().then(db=>{
            db.exec(`insert into item (name, price, image, section, description, userId) values (
                '${item.name}',
                '${item.price}',
                '${item.image}',
                '${item.section}',
                '${item.description}',
                '${item.userId}')`)
            .then(err => {
                console.log("Item inserido com sucesso!");
            }).catch(err => {
                console.log(err);
            });
        })
    }

    // read
    async findItemById(id){
        try {
            var db = await openDb();
            var result = await db.get(`SELECT * FROM "item" WHERE "id" = '${id}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }
    // update
    async updateItem(item){
        try {
            var db = await openDb();
            var result = await db.run(`UPDATE "item" SET 
                "name" = '${item.name}',
                "price" = '${item.price}',
                "image" = '${item.image}',
                "section" = '${item.section}',
                "description" = '${item.description}',
                "userId" = '${item.userId}'
                WHERE "id" = '${item.id}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    async findItemAll(){
        try {
            var db = await openDb();
            var result = await db.all(`SELECT * FROM "item"`);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    // delete
    async deleteItem(id){
        try {
            var db = await openDb();
            var result = await db.run(`DELETE FROM "item" WHERE "id" = '${id}'`);
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

    async findItemBySection(section){
        try {
            var db = await openDb();
            var result = await db.all(`SELECT * FROM "item" WHERE "section" = '${section}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }

    async findItemByUserId(userId){
        try {
            var db = await openDb();
            var result = await db.all(`SELECT "description", "image", "price" FROM "item" WHERE "userId" = '${userId}'`);
            return result;
        }catch(err){
            console.log(err);
        }
    }
}