const nodemailer = require('nodemailer');
nodemailer,createTransport({
    service:'gmail',
    auth:{
        user:process.env.GOOGLE_EMAIL,
        pass:process.env.GOOGLE_APP_PASSWORD,
    }
})
const emailService= {
    send:async(to,subject,body)=>{
        const emailOptons={
            form:process.env.GMAIL_EMAIL,
            to:to,
            subject:subject,
            text:body
        };
        await emailClient.sendMail(emailOptions);


    },
};
module.exports=emailService;