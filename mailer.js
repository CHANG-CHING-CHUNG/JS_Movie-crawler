const nodemailer = require("nodemailer");
const credentials = require("./credentials");

async function sendMaill() {
  const mailTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: credentials.gmail.user,
      pass: credentials.gmail.pass,
    },
  });

  let info = await mailTransport.sendMail({
    from: "Chung <kangan987@gmail.com>",
    to: "John <kangan987@gmail.com>",
    subject: "Hi :)",
    html: "<h1>Hello</h1><p>Nice to meet you.</p>",
  });

  console.log("Message sent: %s", info.messageId);
}

sendMaill();
