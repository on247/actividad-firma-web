var express = require('express');
var router = express.Router();
const _sodium = require('libsodium-wrappers');
const KEY_SIZE=64;
/* GET home page. */

let  hexdump = (buf) => {
  return buf.toString('hex');
}

let processFile = async (file, res) => {
  await _sodium.ready;
  const sodium = _sodium;
  let messages=[];

  let keyPair=sodium.crypto_sign_keypair();
  let pubKey=Buffer.from(keyPair.publicKey);
  let privKey=Buffer.from(keyPair.privateKey);
  messages.push("Clave Publica: "+hexdump(pubKey));
  messages.push("Clave Privada: "+hexdump(privKey));
 
  let fileBuffer= file.data;
  messages.push("Longitud del archivo "+file.size+" bytes");
  messages.push("Contenido original: "+hexdump(fileBuffer).substring(0,32)+"...");
  let signedFileBuffer=Buffer.from(sodium.crypto_sign(fileBuffer,privKey));
  messages.push("Firmado: "+hexdump(signedFileBuffer).substring(0,32)+"...");
  let openedFileBuffer = Buffer.from(sodium.crypto_sign_open(signedFileBuffer, pubKey));
  messages.push("Contenido recuperado: "+hexdump(openedFileBuffer).substring(0,32)+"...");
  if(hexdump(fileBuffer)==hexdump(openedFileBuffer)){
    messages.push("Firma valida");
  }
  else{
    messages.push("Firma invalida");
  }
  res.render('index',{messages})
}
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/', function(req, res, next) {
  let error=null;
  if(!req.files) {
    error="No se subio un archivo";
  }
  else{
    return processFile(req.files.doc,res);
  }
  if(error){
    res.render('index',{error}); 
  }
  else{
    res.render('index'); 
  }
});


module.exports = router;
