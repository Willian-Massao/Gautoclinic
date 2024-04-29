const routes = require('express').Router();
const helper = require('../helpers/helper');
const uuid = require("uuid-lib");

const userDAO = require('../database/userDAO.js');
const agendamentosDAO = require('../database/agendamentosDAO.js');
const funcionariosDAO = require('../database/funcionariosDAO.js');
const fun2proceDAO = require('../database/funcionariosProcedimentosDAO.js');
const procedimentosDAO = require('../database/procedimentosDAO.js');
const transactionDAO = require('../database/transactionDAO.js');

routes.post('/add/', async (req, res) => {
    const { nascimento, data, time, procedimentos, funcionario, aviso } = req.body;
    let consulDate = new Date(data + ' ' + time);
    const proces = new procedimentosDAO();
    const agend = new agendamentosDAO();
    let dataConsulta = consulDate.getFullYear() +"-"+(consulDate.getMonth()+1)+"-"+consulDate.getDate();
    let ListOf = [];
    let transaction;
 
    try{
        //verificar se é maior de 18
        // if(helper.calcularIdade(nascimento) < 18){
        //     throw new Error('É necessário ser maior de 18 anos para marcar um procedimento');
        // }
        //verificar se a data é 1 dia a frente
        if(helper.calcularData(consulDate) < 1){
            throw new Error('É necessário agendar com pelo menos 1 dia de antecedência');
        }
        //verificar se foi aceito os termos
        if(aviso != 'on'){
            throw new Error('É necessário aceitar os termos de uso');
        }
        agend.verificaHorarioFunc({dataHoraAgendamento: consulDate, dataConsulta: dataConsulta}).then(agendamentos => {
                agendamentos.forEach(agendamento => {
                    if(agendamento.PodeAgendar != 1){
                        throw new Error('Este horário, para este funcionario já está reservado por favor escolha outro!');
                    } 
                });
                proces.findId({id: procedimentos}).then( data => {
                    let check_ref = uuid.create().toString();
                    ListOf.push({
                        idsumup: '',
                        idUser: req.user.id,
                        dataHoraAgendamento: consulDate,
                        idProcedimento: data.idProcedimentos,
                        idFuncionario: funcionario,
                        check_ref: check_ref,
                        price: data.preco
                    });
                    transaction = {
                        id: '',
                        idUser: '',
                        check_ref: check_ref,
                        price: data.preco,
                        currency: process.env.SUMUP_CURRENCY,
                        pay2mail: process.env.SUMUP_EMAIL,
                        status: '',
                        date: '',
                        shipping: []
                    }
                    sumupReq(transaction, ListOf, req, res)
                });
                  
        }).catch(err => {
            req.flash('error', err.message);
                res.redirect('/marcar');
        });    
    }catch(err){
        req.flash('error', err.message);
        res.redirect('/marcar');
    }
});

async function sumupReq(trans, ListOf, req, res){
    const agendamentos = new agendamentosDAO();
    const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts',{
        method: 'POST',
        headers: {
            "Authorization": "Bearer " + process.env.SUMUP_KEY,
            "Content-Type": "application/json",
        }, body:JSON.stringify({
            "checkout_reference": trans.check_ref,
            "amount": trans.price,
            "currency": trans.currency,
            "pay_to_email": trans.pay2mail,
        })
    });
    if(apiRes.ok){
        let data = await apiRes.json();

        trans.id = data.id;
        trans.idUser = req.user.id;
        trans.check_ref = data.checkout_reference;
        trans.status = data.status;
        trans.price = data.amount;

            ListOf[0].idsumup = data.id;
            await agendamentos.insert(ListOf[0]).then(()=>{
                res.json({ url: trans.check_ref})
            }).catch(err => {
                    res.status(500).send('Something broke!')
            });    

    //     const paymentGet = await fetch('/consulta/payment/'+ data.checkout_reference,{
    //     method: 'GET',
    //     headers: {
    //         "Content-Type": "application/json",
    //     }
    // });
    // if(paymentGet.ok) {
    //  console.log("VISH")       
    // }
        
    }else{
        res.status(500).send('sumup unauthorized')
    }
}

routes.get('/payment/:id', helper.ensureFunc, (req, res)=>{
    const errorMessage = req.flash('error');
    const agendamentos = new agendamentosDAO();
    
    agendamentos.findId({idUser: req.user.id, check_ref: req.params.id}).then( data =>{
        res.render('payment', {data: data, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.get('/orders', helper.ensureFunc, (req, res) => {
    const errorMessage = req.flash('error');
    const agendamentos = new agendamentosDAO();

    const ptTable = {
        'PAID': 'PAGO',
        'FINISH': 'COMPLETADO',
        'ACCEPT': 'ACEITO',
        'REFUNDED': 'CANCELADO',
    }

    try{
        agendamentos.findFunc({idFuncionario: 1}).then( data => {
            //merge itens with same check_ref into one preserving all idProcedimento in array first
            //filter PENDING not enter
            data = data.filter( item => item.status != 'PENDING');
            data = data.map( item => {
                item.status = ptTable[item.status];
                return item;
            });
            data = mergeItems(data);
            res.render('consultasFunc', {data: data, user: req.user, error: errorMessage});
        });
    }catch(err){
        console.log(err);
        res.status(500).send('Something broke!');
    }
    function mergeItems(data){
        let merged = [];
        let check = [];
        let temp = {};
        for (let item of data) {
            if(check.includes(item.check_ref)){
                temp = merged.find( obj => obj.check_ref == item.check_ref);
                temp.idProcedimento.push(item.idProcedimento);
            }else{
                check.push(item.check_ref);
                temp = item;
                temp.idProcedimento = [item.idProcedimento];
                merged.push(temp);
            }
        }
        return merged;
    }
});

routes.get('/orders/:id', helper.ensureFunc, (req, res) => {
    const errorMessage = req.flash('error');
    const agendamentos = new agendamentosDAO();

    const ptTable = {
        'PAID': 'PAGO',
        'FINISH': 'COMPLETADO',
        'ACCEPT': 'ACEITO',
        'REFUNDED': 'CANCELADO',
    }

    try{
        agendamentos.findCheck_ref({idFuncionario: 1, check_ref: req.params.id}).then( data => {
            //merge itens with same check_ref into one preserving all idProcedimento in array first
            //filter PENDING not enter
            data = data.filter( item => item.status != 'PENDING');
            data = data.map( item => {
                item.status = ptTable[item.status];
                return item;
            });
            res.render('consultasFuncInfo', {data: data, user: req.user, error: errorMessage});
        });
    }catch(err){
        console.log(err);
        res.status(500).send('Something broke!');
    }
    function mergeItems(data){
        let merged = [];
        let check = [];
        let temp = {};
        for (let item of data) {
            if(check.includes(item.check_ref)){
                temp = merged.find( obj => obj.check_ref == item.check_ref);
                temp.idProcedimento.push(item.idProcedimento);
            }else{
                check.push(item.check_ref);
                temp = item;
                temp.idProcedimento = [item.idProcedimento];
                merged.push(temp);
            }
        }
        return merged;
    }
});


module.exports = routes;