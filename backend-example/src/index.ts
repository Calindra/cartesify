import { BackendCartesify } from "./BackendCartesify";

const app = BackendCartesify.createApp()

// start app
app.start().catch((e) => {
    console.error(e);
    process.exit(1)
});
