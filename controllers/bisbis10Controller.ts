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

  const requiredProperties = ["name", "isKosher", "cuisines"];

  const missingProperties = requiredProperties.filter(
    (property) =>
      !Object.keys(req.body).includes(property) ||
      req.body[property] === undefined
  );

  const forbiddenProperties = ["id", "averageRating", "dishes"].filter(
    (property) => Object.keys(req.body).includes(property)
  );

  const unrecognizedProperties = Object.keys(req.body).filter(
    (property) =>
      !requiredProperties.includes(property) &&
      !forbiddenProperties.includes(property)
  );

  if (missingProperties.length > 0) {
    return res
      .status(400)
      .send(
        `Bad request. Required properties are missing: ${missingProperties.join(
          ", "
        )}`
      );
  }

  if (typeof name !== "string") {
    return res.status(400).send("Bad Request. name must be a string");
  }

  if (typeof isKosher !== "boolean") {
    return res.status(400).send("Bad Request. isKosher must be a boolean");
  }

  if (
    !(
      Array.isArray(cuisines) &&
      cuisines.every((elem) => typeof elem === "string")
    )
  ) {
    return res
      .status(400)
      .send("Bad Request. cuisines must be an array of strings");
  }

  if (unrecognizedProperties.length > 0) {
    return res
      .status(400)
      .send(
        `Bad Request. Unrecognized properties in request: ${unrecognizedProperties.join(
          ", "
        )}`
      );
  }

  if (forbiddenProperties.length > 0) {
    return res
      .status(422)
      .send(
        `Unprocessable Entity. The following properties cannot be included in the creation request: ${forbiddenProperties.join(
          ", "
        )}`
      );
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
