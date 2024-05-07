import { Request, Response, Router } from "express";
import client from "../db/db";
import { QueryConfig, QueryResult } from "pg";
import { Restaurant } from "../types/types";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to BISBIS10 Server");
});

router.get("/restaurants", async (req: Request, res: Response) => {
  const { cuisine } = req.query;

  let result: QueryResult<Omit<Restaurant, "dishes">>;

  if (cuisine) {
    const query: QueryConfig = {
      text: 'SELECT id, name, "averageRating", "isKosher", cuisines FROM restaurants WHERE $1 = ANY(cuisines);',
      values: [cuisine],
    };
    result = await client.query(query);
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
    const query: QueryConfig = {
      text: "SELECT * FROM restaurants WHERE id = $1",
      values: [id],
    };
    const result: QueryResult<Restaurant> = await client.query(query);
    return res.status(200).send(result.rows);
  } catch (err) {}
});

router.post("/restaurants", async (req: Request, res: Response) => {
  const {
    name,
    isKosher,
    cuisines,
  }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

  if (name === undefined) {
    return res.status(400).send("Invalid request: missing property 'name'");
  }

  if (typeof name !== "string") {
    return res.status(400).send("Invalid request: name must be a string");
  }

  if (isKosher === undefined) {
    return res.status(400).send("Invalid request: missing property 'isKosher'");
  }

  if (typeof isKosher !== "boolean") {
    return res.status(400).send("Invalid request: isKosher must be a boolean");
  }

  if (cuisines === undefined) {
    return res.status(400).send("Invalid request: missing property 'cuisines'");
  }

  if (
    !(
      Array.isArray(cuisines) &&
      cuisines.every((elem) => typeof elem === "string")
    )
  ) {
    return res
      .status(400)
      .send("Invalid request: cuisines must be an array of strings");
  }

  try {
    const query: QueryConfig = {
      text: `
        INSERT INTO restaurants (name, "isKosher", cuisines)
        VALUES ($1, $2, $3)
        ;
      `,
      values: [name, isKosher, cuisines],
    };

    await client.query(query);
  } catch (err) {}

  return res.status(201).send();
});

export default router;
