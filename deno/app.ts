import {
    Application,
    send
} from "https://deno.land/x/oak/mod.ts";
import {
    viewEngine, 
    engineFactory,
    adapterFactory
} from "https://deno.land/x/view_engine/mod.ts";
import router from "./routes.ts";

const env = Deno.env.toObject();
const HOST = env.HOST || "127.0.0.1";
const PORT = env.PORT || 7700;

const app = new Application();

const ejsEngine = await engineFactory.getEjsEngine();
const oakAdapter = await adapterFactory.getOakAdapter();

// https://medium.com/recoding/rendering-html-css-in-deno-using-view-engine-e07469613598
// something wrong here
// app.use(async (context, next) => {
//     await send(context, context.request.url.pathname, {
//         root: `${Deno.cwd()}/views`
//     });
//     next();
// });
app.use(viewEngine(oakAdapter, ejsEngine));
app.use(router.routes());
app.use(router.allowedMethods());

console.log(`Listening on ${HOST}:${PORT}.`);
await app.listen(`${HOST}:${PORT}`);
