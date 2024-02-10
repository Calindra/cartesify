import axios from "axios";

let started = false;

export class HealthCheckCommand {
    static async execute() {
        if (!started) {
            console.log('Waiting for the server health...')
            started = true
            let i = 0;
            while (i < 10) {
                i++;
                await new Promise((resolve) => setTimeout(resolve, 1000))
                try {
                    console.log('Attempt number', i)
                    await axios.get('http://127.0.0.1:8383/health')
                    break
                } catch (e) {
                    if ((e as any).code === 'ECONNREFUSED') {
                        console.log('ECONNREFUSED')
                    } else {
                        console.error(e)
                    }
                }
            }
        }
    }
}