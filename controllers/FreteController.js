class Frete{
    constructor(envio){
        this.agencias = [envio.agencias];
        this.escolha;
        this.to = envio.to;
        this.from = envio.from;
    }

    setAgencias(agencias){
        this.agencias = agencias;
    }
    setEscolha(escolha){
        this.escolha = escolha;
    }
    getAgencias(){
        return this.agencias;
    }
    getEscolha(){
        return this.escolha;
    }
}
module.exports = Frete;