import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: '1320944069@qq.com',
    pass: 'zgyifxzquidyiacj',
  },
})

const info = await transporter.sendMail({
  from: '"民宿管家测试" <1320944069@qq.com>',
  to: 'kelin0205113@gmail.com',
  subject: 'SMTP 测试邮件',
  text: '这是一封通过 nodemailer + QQ 邮箱 SMTP 发送的测试邮件。\n发送时间：' + new Date().toLocaleString(),
  html: '<p>这是一封通过 <b>nodemailer + QQ 邮箱 SMTP</b> 发送的测试邮件。</p><p>发送时间：' + new Date().toLocaleString() + '</p>',
})

console.log('邮件发送成功！')
console.log('Message ID:', info.messageId)
console.log('Accepted:', info.accepted)
console.log('Rejected:', info.rejected)
