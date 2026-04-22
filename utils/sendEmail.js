var nodemailer = require('nodemailer');

const sendEmail = async (to, subject, htmlContent) => {
    try {
        // Cấu hình tài khoản người gửi (Admin)
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'admint36@gmail.com', 
                pass: 'sdpj xqdw vntx uwwa' 
            }
        });

        // Cấu hình lá thư
        var mailOptions = {
            from: '"PKStore Support" <admint36@gmail.com>', // Tên người gửi
            to: to, // Email người nhận
            subject: subject, // Tiêu đề thư
            html: htmlContent // Nội dung thư (Hỗ trợ code HTML để làm đẹp)
        };

        // Bóp cò gửi thư
        await transporter.sendMail(mailOptions);
        return true;

    } catch (error) {
        console.error("Lỗi gửi email: ", error);
        return false;
    }
};

module.exports = sendEmail;