import sgMail from "@sendgrid/mail";

export async function sendEmail(
  subject = "",
  recipients = [],
  body = "",
  attachments = []
) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const sendList = recipients.map((e) => {
      return {
        email: e,
      };
    });
    const responses = [];
    for (let email of sendList) {
      console.log(email);

      const msg = {
        from: "info@one-constellation.com",
        personalizations: [
          {
            to: sendList,
          },
        ],
        subject: "OneConstellation -" + subject,
        html: body,
        attachments: attachments,
        //   attachments: [
        //         {
        //             filename: `report.pdf`,
        //             content: fileAttachment,
        //             type: 'application/pdf',
        //             disposition: 'attachment'
        //         }
        //     ]
      };

      responses.push(sgMail.send(msg));
    }
    const queue = await Promise.allSettled(responses);
    return queue;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function sendEmailWithTemplate(
  templateId = "",
  subject = "",
  recipients = [],
  vars = {},
  attachments = []
) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const sendList = recipients.map((e) => {
      return {
        email: e,
      };
    });
    const msg = {
      from: "info@one-constellation.com",
      personalizations: [
        {
          to: sendList,
        },
      ],
      dynamicTemplateData: {
        ...vars,
        SUBJECT: subject,
      },
      templateId: templateId,
      attachments: attachments,
    };

    console.log(msg);

    const a = await sgMail.send(msg);
    return a;
  } catch (error) {
    console.log(error);
    return false;
  }
}
