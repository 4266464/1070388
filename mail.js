const nodemailer = require('nodemailer');

module.exports.email = function(title,message,mail,key) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.163.com', // replace with your SMTP server
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: mail, // replace with your email
            pass: key // replace with your password
        }
    });

    const mailOptions = {
        from: mail, // sender address
        to: mail, // list of receivers
        subject: title, // Subject line
        text: message, // plain text body
    };

    try {
        transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(`An error occurred while sending the ${title} email: ${message}`);
    }
}
