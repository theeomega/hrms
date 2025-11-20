import { createApp } from "../server/app";

let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    const result = await createApp();
    app = result.app;
  }
  app(req, res);
}
