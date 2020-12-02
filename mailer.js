const nodemailer = require("nodemailer");
const credentials = require("./credentials");

var mailTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: credentials.gmail.user,
    pass: credentials.gmail.password,
  },
});
