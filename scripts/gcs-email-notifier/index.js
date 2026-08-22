const functions = require('@google-cloud/functions-framework');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Explicitly register a CloudEvent callback 
functions.cloudEvent('sendEmailOnUpload', async (cloudEvent) => {
  // Defensive verification to avoid crash properties errors
  if (!cloudEvent || !cloudEvent.data || !cloudEvent.data.message) {
    console.error("Invalid event structure received:", cloudEvent);
    return;
  }

  // Extract and decode the incoming Pub/Sub bucket storage payload
  const pubsubData = Buffer.from(cloudEvent.data.message.data, 'base64').toString();
  const fileEvent = JSON.parse(pubsubData);

  const msg = {
    to: 'werner.garcia@gmail.com', 
    from: 'virlatinus@gmail.com', 
    subject: `⚠️ GCS Alert: New File Added`,
    text: `A new file named "${fileEvent.name}" was successfully dropped into bucket "${fileEvent.bucket}".`,
    html: `<strong>Bucket update detected:</strong><br>
           File: <code>${fileEvent.name}</code><br>
           Bucket: <code>${fileEvent.bucket}</code>`
  };

  try {
    await sgMail.send(msg);
    console.log(`Success: Notification dispatched for ${fileEvent.name}`);
  } catch (error) {
    console.error('Error forwarding message out via SendGrid API:', error);
  }
});
