const nodemailer = require("nodemailer")

const mailSender = async (email, title, body) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtppro.zoho.in',
            port: 465,
            secure: true,
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
            from: process.env.MAIL_USER,
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
