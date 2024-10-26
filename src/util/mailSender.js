const nodemailer = require("nodemailer")
const mailSender = async (email, title, body) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            // secure: false,
            // requireTLS: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            // tls: {
            //     rejectUnauthorized: false,
            // },
        });
        const info = await transporter.sendMail({
            from: 'connectthesocialmedia@gmail.com',
            to: email,
            subject: title,
            html: body,
        });
        return info;
    } catch (error) {
        console.log(error);
    }
};
module.exports = mailSender