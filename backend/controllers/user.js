const firebase = require('../serviceAccount/firebase').firebase
const storage = require('../serviceAccount/firebase').storage
const bucket = storage.bucket();
const users = firebase.collection('Users')
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const passwordValidator = require('password-validator');
const validator = require("email-validator");
const springedge = require('springedge');
const nodemailer = require("nodemailer");
const cron = require('node-cron');
const fs =require("fs"); 
const base64ToImage = require('base64-to-image');
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const { error } = require('console');
const maxSize =  1 * 1024 * 1024 // file size ihdee 1MB
const a = Math.floor(1000 + Math.random() * 9000); 
const now = new Date()
const CONFIG = {                                                                      
    action: 'read',                                                               
    expires: '03-01-2500',                                                        
}
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

exports.login = function(req, res){
    let email = req.body.email
    let password = req.body.password
    // let repassword = req.body.repassword
    users.get().then(snapshot =>{
        snapshot.forEach( doc =>{
            if(doc.id === email){
                users.doc(email).get().then(snapshot =>{
                    let hash = snapshot.data().pass.hash
                    let salt = snapshot.data().pass.salt
                    validatePassword(password , hash , salt).then(result =>{
                        if(result){
                            toAuthJSON(email).then(result =>{
                                res.status(200).json(result)
                            })
                        }
                        else{
                            res.status(400).json({
                                error : "pass buruu bn"
                            })
                        }
                })
            })
            }
            else{
                res.status(401).json({
                    error : "email oldsongui"
                })
            }
        })
    })
    
}

exports.registration = function(req,res){
    let email = req.body.email
    let password = req.body.password
    let symbols = /[-!$%^&*()+| ~=`{}\[\]:";'<>?,.\/]/;
    
    let schema = new passwordValidator();
    schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    //.has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits()                                 // Must have digits
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values
    
    validator.validate("test@email.com"); // true
    if(schema.validate(password)===false){
        res.status(402).json(schema.validate(password, { list: true }))
    }
    else if(validator.validate(email)===false){
        res.status(404).json({
            error : "email ee shalgana uu "
        })
    }
    else{
        encryptPassword(password).then(result =>{
            toAuthJSON(email).then(rest=>{
                firestore(result,rest, email).then(f =>{
                    if(f){
                        res.status(200).json(rest)
                    }
                })    
            })
        })
    }
}

exports.information = function(req , res){
    let email = req.payload.email
    let username = req.body.username
    let lastname = req.body.lastname
    let gender = req.body.gender
    let born = req.body.born
    if(username === undefined){
        res.status(400).json({
            error : "username undefined"
        })
    }
    else if(lastname === undefined){
        res.status(401).json({
            error : "lastname undefined"
        })
    }
    else if(born=== undefined){
        res.status(402).json({
            error : "born undefined"
        })
    }
    else{
        users.doc(email).get().then(result =>{
            if(result.data().username === undefined){
                informationSet(username , lastname , gender ,born , email).then(result =>{
                    if(result){
                        res.status(200).json({
                            success : "medeelel hadgalagdlaa"
                        })
                    }
                })
            }
            else{
                informationUpdate(username , lastname , gender ,born , email).then(result =>{
                    if(result){
                        res.status(200).json({
                            success : "medeelel shinjlegtlee"
                        })
                    }
                })   
            }    
        })
    }
}
exports.changePassword = function(req ,res){
    let email = req.payload.email
    let password = req.body.password
    let repassword = req.body.repassword
    if(body ===undefined){
        res.status(400).json({
            error : "body undefined"
        })
    }
    else{
        if(password === repassword){
            encryptPassword(password).then(result =>{
                changePass(result , email).then(result =>{
                    if(result){
                        res.status(200).json({
                            success : "pass shinjlegdlee"
                        })
                    }
                })
            })
        }
    }
}
exports.verificationPhone = function(req , res){
    let email = req.payload.email
    let phone = req.body.phone 
    users.doc(email).update({
        phone : phone
    })
    var params = {
        'apikey': '',
        'sender': '_shg_0.0', // Sender Name
        'to': [
            phone  //Moblie Number
        ],
        'message': a+'Баталгаажуулах код',
        'format': 'json'
    };
    let item ={
        code : a,
        expiry : now.getTime()+ 60000
    } 
    localStorage.setItem("code",JSON.stringify(item));
    springedge.messages.send(params, 5000, function (err, response) {
    if (err) {
      return console.log(err);
    }
    else{
        res.status(200).json({
            success : "verification code ilgeegdsen"
        })
    }
    console.log(response);
  });
  cron.schedule('*/5 * * * *', () => {
    localStorage.clear();
});
}
exports.confirmCode = function (req , res){
    let code = req.body.code
    let x = localStorage.getItem("code");
    if(JSON.parse(code) === JSON.parse(x).code){
        res.status(200).json({
            success : "Batalgaajsan"
        })
    }
    else{
        res.status(400).json({
            error : 'code buru bn'
        })
    }
}
exports.changeNumber = function(req ,res){
    let phone = req.body.code
    let email = req.payload.email
    users.doc(email).update({
        phone : phone
    })
    res.status(200).json({
        success : "dugaar soligdson"
    })
}
exports.verificationEmail = function(req , res){
    let email = req.payload.email
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure : false,
        auth: {
          user: 'wozniaka997@gmail.com',
          pass: 'Altanshagai1'
        }
    });
    let mailOptions = {
        from: 'wozniaka997@gmail.com',
        to: email,
        subject: '_shg_0.0',
        text: a +'  '+'verifications code'
    };
    let item ={
        code : a
    } 
    localStorage.setItem("Mailcode",JSON.stringify(item));
    console.log(localStorage.getItem("Mailcode"));
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            res.status(200).json({
                success: "code ilgeegdsen"
            })
            console.log('Email sent: ' + info.response);
        }
    });
    cron.schedule('*/5 * * * *', () => {
        localStorage.clear();
    });
}

exports.confirmEmail = function(req , res){
    let code = req.body.code
    let x = localStorage.getItem("Mailcode");
    if(JSON.parse(code) === JSON.parse(x).code){
        res.status(200).json({
            success : "Batalgaajsan"
        })
    }
    else{
        res.status(400).json({
            error : 'code buru bn'
        })
    }
}
async function changePass(result , email){
    await users.doc(email).update({
        pass : result
    })
    return true
}
async function informationUpdate(username , lastname , gender , born , email){
    await users.doc(email).update({
        username : username,
        lastname : lastname , 
        gender : gender,
        born : born
    })
    return true
}

async function informationSet(username, lastname, gender , born , email){
    await users.doc(email).update({
        username : username,
        lastname : lastname , 
        gender : gender,
        born : born,
        phone : null
    })
    return true
}

async function validatePassword(password, user_hash, user_salt) {
    const hash = await crypto.pbkdf2Sync(password, user_salt, 10000, 512, 'sha512').toString('hex');
    if(hash === user_hash) {
      return true
    } else {
      return false
    }
};
async function encryptPassword(password){
    let salt = await crypto.randomBytes(16).toString('hex');
    let hash = await crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');
    return {salt : salt, hash : hash}
}
async function firestore(result,rest , email){
    await users.doc(email).set({
        pass:result,
        email : rest
    })
    return true
}
async function toAuthJSON(email) {
    return {
      email: email.toLowerCase(),
      token: jwt.sign({ email: email.toLowerCase() }, 'error'),
    };
};