import { Request, Response, Router } from "express";
import client from "../db/db";
import { QueryResult } from "pg";
import { Restaurant } from "../types/types";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to BISBIS10 Server");
});

router.get("/restaurants", async (req: Request, res: Response) => {
  const { cuisine } = req.query;

  let result: QueryResult<Omit<Restaurant, "dishes">>;

  if (cuisine) {
    result = await client.query(
      'SELECT id, name, "averageRating", "isKosher", cuisines FROM restaurants WHERE $1 = ANY(cuisines);',
      [cuisine as string]
    );
  } else {
    result = await client.query(
      'SELECT id, name, "averageRating", "isKosher", cuisines FROM restaurants;'
    );
  }

  return res.status(200).send(result.rows);
});

router.get("/restaurants/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  if (
    isNaN(Number.parseInt(id)) ||
    Number.parseInt(id) !== Number.parseFloat(id)
  ) {
    return res
      .status(400)
      .send("Invalid request: restaurant ID must be an integer");
  }

  try {
    const result: QueryResult<Restaurant> = await client.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [id]
    );
    return res.status(200).send(result.rows);
  } catch (err) {}
});

export default router;
