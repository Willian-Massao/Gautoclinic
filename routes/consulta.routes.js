const routes = require('express').Router();
const helper = require('../helpers/helper');
const uuid = require("uuid-lib");

const userDAO = require('../database/userDAO.js');
const agendamentosDAO = require('../database/agendamentosDAO.js');
const funcionariosDAO = require('../database/funcionariosDAO.js');
const fun2proceDAO = require('../database/funcionariosProcedimentosDAO.js');
const procedimentosDAO = require('../database/procedimentosDAO.js');
const transactionDAO = require('../database/transactionDAO.js');
const refoundDAO = require("../database/refoundDAO.js");

routes.post('/add/', async (req, res) => {
    const { nascimento, data, time, procedimentos,  aviso } = req.body;
    let consulDate = new Date(data + ' ' + time);
    const proces = new procedimentosDAO();
    const agend = new agendamentosDAO();
    const funcionario = 1;
    let dataConsulta = consulDate.getFullYear() +"-"+(consulDate.getMonth()+1).toString().padStart(2,'0')+"-"+consulDate.getDate().toString().padStart(2,'0');
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
        console.log({dataHoraAgendamento: consulDate, id: procedimentos});
        agend.verificaHorarioFunc({dataHoraAgendamento: consulDate, id: procedimentos}).then(agendamentos => {
            if(agendamentos.length > 0){
                console.log(agendamentos);
                agendamentos.forEach(agendamento => {
                    if(agendamento.PodeAgendar != 1){
                        throw new Error('Este horário já está reservado. Por favor, selecione outro horário disponível.');
                    } 
                });
            }    
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
                    //sumupReq(transaction, ListOf, req, res)
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
            "return_url": "https://gautoclinic.com.br/consulta/consulStatus",
            "redirect_url": "https://gautoclinic.com.br/"
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
                res.redirect('/consulta/payment/'+ data.checkout_reference);
            }).catch(err => {
                req.flash('error', 'Erro ao inserir no banco de dados');
                res.redirect('/marcar');
            });    

    }else{
        res.status(500).send('sumup unauthorized')
    }
}

routes.get('/payment/:id', helper.ensureAuthenticated, (req, res)=>{
    const errorMessage = req.flash('error');
    const agendamentos = new agendamentosDAO();
    
    agendamentos.findId({idUser: req.user.id, check_ref: req.params.id}).then( data =>{
        res.render('payment', {data: data, user: req.user, error: errorMessage});
    }).catch(err => res.status(500).send('Something broke!'));
});

routes.post('/consulStatus', async (req, res)=>{
    const agendamentos = new agendamentosDAO();
    const { id, status, event_type } = req.body;

    console.log(req.body);

    if(event_type == 'CHECKOUT_STATUS_CHANGED'){
        try{
            //vai verificar com a pripria sumupa
            const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts/' + id,{
                method: 'GET',
                headers: 
                {
                    'Authorization': 'Bearer ' + process.env.SUMUP_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if(apiRes.ok){
                let temp = await apiRes.json();
                console.log(temp);

                //se a resposta da api for diferente de pendente
                if(temp.status != 'PENDING'){
                    console.log({status: temp.status, confirmado:1, check_ref: temp.checkout_reference})
                    await agendamentos.changeStatus({status: temp.status, confirmado:1, check_ref: temp.checkout_reference});
                }else{
                    console.log({status: temp.status, confirmado:0, check_ref: temp.checkout_reference})
                    await agendamentos.changeStatus({status: temp.status, confirmado:0, check_ref: temp.checkout_reference});
                }
                res.sendStatus(201);
            }else{
                let temp = await apiRes.json();
                console.log(temp)
            }
        }catch(err){
            console.log(err)
        }
    }else{
        console.log('Algo esta muito errado, o que retornou da sumup e o que foi chamado aqui está diferente, espero nunca ver isso no console')
    }
})

routes.post('/accept', helper.ensureAdmin, async (req, res) =>{
    const {checkRef} = req.body;
    const agendamentos = new agendamentosDAO();
    const assunto = "Confirmação agendamento GautoClinic";

    let tableAgendamento = await agendamentos.findCheck_ref({idFuncionario:1,check_ref:checkRef});
    //console.log(tableAgendamento);
    let html = `<style>.container {display: flex;justify-content: center;align-items: center;font-family: sans-serif;background-color: #cccccc;padding: 30px;   }   .carta {width: 300px;border-radius: 10px;display: flex;flex-direction: column;justify-content: space-between;padding: 10px;background-color: #fff;box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);   }   .carta__header {text-align: center;   }   .carta__body {text-align: center;   }   .carta__footer {text-align: center;   }   .carta__logo{width: 100%;height: 50px;display: flex;justify-content: center;align-items: center;   }   .carta__logo img{max-width: 100%;max-height: 100%;flex-shrink: 0;   }</style><div class="container">   <div class="carta"><div class="carta__logo">    <img src="https://gautoclinic.com.br/src/logo.png" alt="Logo GautoClinic"></div><div class="carta__header">    <h1>Olá, ${req.user.name}</h1></div><div class="carta__body">    <p>O seu agendamento para o procedimento ${tableAgendamento[0].idProcedimento} foi confirmado para o dia ${tableAgendamento[0].dataHoraAgendamento} estaremos esperando por você.</p></div><div class="carta__footer">    <p>Atenciosamente Equipe GautoClinic.</p></div>   </div></div>`
    const text = "";
    await agendamentos.confirmaAgendamento({status: 'ACCEPT', confirmado:1, idUser:req.user.id, check_ref:checkRef});
    helper.sendEmail(req.user.email,assunto,html,text);
    res.redirect('/consulta/orders');
})

routes.post('/finish', helper.ensureAdmin, async (req, res)=>{
    const { checkRef } = req.body;
    const agendamentos = new agendamentosDAO();

    let tableAgendamento = await agendamentos.findCheck_ref({idFuncionario:1,check_ref:checkRef});

    if(tableAgendamento[0].status == 'ACCEPT'){
        await agendamentos.changeStatus({status: 'FINISH', confirmado:1, check_ref:checkRef});
        res.redirect('/consulta/orders');
    }else{
        req.flash('error', 'A consulta não foi aceita para ser cancelada');
        res.redirect('/consulta/orders');
    }
});

routes.post('/cancel', helper.ensureAdmin, async (req, res) =>{
    const {checkRef} = req.body;
    const agendamentos = new agendamentosDAO();
    const assunto = "Cancelamento agendamento GautoClinic";
    
    let tableAgendamento = await agendamentos.findCheck_ref({idFuncionario:1,check_ref:checkRef})
    let html = "Olá, "+ req.user.name +" o seu agendamento para o procedimento " + tableAgendamento[0].idProcedimento + " do dia " + tableAgendamento[0].dataHoraAgendamento+ " foi estornado e cancelado pela nossa equipe, por favor entre em contato conosco para mais informações. Atenciosamente Equipe GautoClinic."
    const text = "";

    const apiRes = await fetch('https://api.sumup.com/v0.1/checkouts/' + tableAgendamento[0].id,{
                method: 'GET',
                headers: 
                {
                    'Authorization': 'Bearer ' + process.env.SUMUP_KEY,
                    'Content-Type': 'application/json'
                }
    });
    if(apiRes.ok){
        let temp = await apiRes.json();
        console.log(temp);

        //se a resposta da api for diferente de pendente
        if(temp.status != 'PENDING'){
            let fetchres = await fetch('https://api.sumup.com/v0.1/me/refund/' + temp.transaction_id,{
                method: 'POST',
                headers: {
                    "Authorization": "Bearer " + process.env.SUMUP_KEY,
                }
            });
            
            if(fetchres.ok){
                console.log({status: 'REFUNDED', confirmado:0, check_ref:temp.checkout_reference });
                await agendamentos.changeStatus({status: 'REFUNDED', confirmado:0, check_ref:temp.checkout_reference });
                helper.sendEmail(req.user.email,assunto,html,text);
                res.redirect('/consulta/orders');
            }else{
                let apiRes = await fetchres.json();
                console.log(apiRes);
                req.flash('error', 'Erro ao fazer o reembolso');
                res.redirect('/consulta/orders');
            }
        }else{
            req.flash('error', 'Erro na API, contate o administrador');
            res.redirect('/orders');
        }
    }else{
        req.flash('error', 'O pagamento não está em um status reembolsável');
        res.redirect('/orders');
    }
})

routes.get('/orders', helper.ensureAdmin, (req, res) => {
    const errorMessage = req.flash('error');
    const agendamentos = new agendamentosDAO();
    let consulDate = new Date();
    let dataConsulta = consulDate.getFullYear() +"-"+(consulDate.getMonth()+1).toString().padStart(2,'0')+"-"+consulDate.getDate().toString().padStart(2,'0');

    const ptTable = {
        'PAID': 'PAGO',
        'FINISH': 'COMPLETO',
        'ACCEPT': 'ACEITO',
        'REFUNDED': 'CANCELADO',
    }

    try{
        agendamentos.select({data:dataConsulta}).then( data => {
            //merge itens with same check_ref into one preserving all idProcedimento in array first
            //filter PENDING not enter
            data = data.filter( item => item.status != 'PENDING');
            data = data.map( item => {
                item.status = ptTable[item.status];
                return item;
            });
            data = mergeItems(data);
            //console.log(data);
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

routes.get('/orders/:id', helper.ensureAdmin, (req, res) => {
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
});


module.exports = routes;