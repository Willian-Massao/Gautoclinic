class Envio{
    constructor(envio){
        this.client_id = envio.client_id;
        this.client_secret = envio.client_secret;
        this.access_token = envio.access_token;
        this.refresh_token = envio.refresh_token;
        this.expired_at = envio.expired_at;
        this.redirect_uri = envio.redirect_uri;
        this.indicador_ativo = true;
    }
}
module.exports = Envio;