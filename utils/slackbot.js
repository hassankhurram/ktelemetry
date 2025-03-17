import axios from "axios"
export class SlackBot {

 
    static async sendMessage(text) {
        try {
            // const response = await axios({
            //     url: process.env.SLACK_BOT_URL,
            //     method: "POST",
            //     data: {
            //         "channel": process.env.SLACK_BOT_CHANNEL,
            //         "username": `kTelemetry`,
            //         text
            //     }
            // })
            return;
        } catch (error) {
            console.error("slackbot error:",error)
        }
    }

}       