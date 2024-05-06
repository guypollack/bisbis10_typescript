import { Request, Response, Router } from "express";
import client from "../db/db";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to BISBIS10 Server");
});

router.get("/restaurants", async (req: Request, res: Response) => {
  const { cuisine } = req.query;

  if (cuisine) {
    const result = await client.query(
      "SELECT * FROM restaurants WHERE $1 = ANY(cuisines);",
      [cuisine as string]
    );
    return res.status(200).send(result.rows);
  }

  const result = await client.query(
    'SELECT id, name, "averageRating", "isKosher", cuisines FROM restaurants;'
  );
  return res.status(200).send(result.rows);
});

export default router;
