const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify'); 

const transport = nodemailer.createTransport({
	host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "75d4e7cc969e53",
    pass: "e929b55153b01f"
	},
});

const generateHTML = (filename, options = {}) => {
	const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
	const inlined = juice(html);
	return inlined;
};

exports.send = async (options) => {
	const html = generateHTML(options.filename, options)
	const text = htmlToText.fromString(html);
	const mailOptions = {
		from: `Clint Rowden <noreply@gmail.com>`,
		to: options.user.email,
		subject: options.subject,
		text,
		html,
	};
	const sendMail = promisify(transport.sendMail, transport);
	return sendMail(mailOptions);
};
