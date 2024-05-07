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
    return res.status(400).send("Bad Request. id must be an integer");
  }

  try {
    const query: QueryConfig = {
      text: "SELECT * FROM restaurants WHERE id = $1",
      values: [id],
    };
    const result: QueryResult<Restaurant> = await client.query(query);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .send("The restaurant with the specified id was not found");
    }

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

  // Check for missing required properties in request body
  const missingPropertiesInRequest = requiredProperties.filter(
    (property) =>
      !Object.keys(req.body).includes(property) ||
      req.body[property] === undefined
  );

  if (missingPropertiesInRequest.length > 0) {
    return res
      .status(400)
      .send(
        `Bad Request. Required properties are missing: ${missingPropertiesInRequest.join(
          ", "
        )}`
      );
  }

  // Check for not allowed properties being sent in request body
  const forbiddenProperties = ["id", "averageRating", "dishes"];

  const forbiddenPropertiesInRequest = forbiddenProperties.filter((property) =>
    Object.keys(req.body).includes(property)
  );

  if (forbiddenPropertiesInRequest.length > 0) {
    return res
      .status(422)
      .send(
        `Unprocessable Entity. The following properties cannot be included in the creation request: ${forbiddenPropertiesInRequest.join(
          ", "
        )}`
      );
  }

  // Check for unrecognized properties being sent in request body
  const unrecognizedPropertiesInRequest = Object.keys(req.body).filter(
    (property) =>
      !requiredProperties.includes(property) &&
      !forbiddenProperties.includes(property)
  );

  if (unrecognizedPropertiesInRequest.length > 0) {
    return res
      .status(400)
      .send(
        `Bad Request. Unrecognized properties in request: ${unrecognizedPropertiesInRequest.join(
          ", "
        )}`
      );
  }

  // Check that all data types of columns to be added are correct
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

router.put("/restaurants/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    isKosher,
    cuisines,
  }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

  if (
    isNaN(Number.parseInt(id)) ||
    Number.parseInt(id) !== Number.parseFloat(id)
  ) {
    return res.status(400).send("Bad Request. id must be an integer");
  }

  const allowedProperties = ["name", "isKosher", "cuisines"];

  // Check for not allowed properties being sent in request body
  const forbiddenProperties = ["id", "averageRating", "dishes"];

  const forbiddenPropertiesInRequest = forbiddenProperties.filter((property) =>
    Object.keys(req.body).includes(property)
  );

  if (forbiddenPropertiesInRequest.length > 0) {
    return res
      .status(422)
      .send(
        `Unprocessable Entity. The following properties cannot be updated: ${forbiddenPropertiesInRequest.join(
          ", "
        )}`
      );
  }

  // Check for unrecognized properties being sent in request body
  const unrecognizedPropertiesInRequest = Object.keys(req.body).filter(
    (property) =>
      !allowedProperties.includes(property) &&
      !forbiddenProperties.includes(property)
  );

  if (unrecognizedPropertiesInRequest.length > 0) {
    return res
      .status(400)
      .send(
        `Bad Request. Unrecognized properties in request: ${unrecognizedPropertiesInRequest.join(
          ", "
        )}`
      );
  }

  // Check that all data types of columns to be updated are correct
  if (name !== undefined && typeof name !== "string") {
    return res.status(400).send("Bad Request. name must be a string");
  }

  if (isKosher !== undefined && typeof isKosher !== "boolean") {
    return res.status(400).send("Bad Request. isKosher must be a boolean");
  }

  if (
    cuisines !== undefined &&
    !(
      Array.isArray(cuisines) &&
      cuisines.every((elem) => typeof elem === "string")
    )
  ) {
    return res
      .status(400)
      .send("Bad Request. cuisines must be an array of strings");
  }

  // Compose update query
  const columnsToUpdate = allowedProperties.filter((property) =>
    Object.keys(req.body).includes(property)
  );

  const setClauseComponents: string[] = [];
  const setClauseParameters: Pick<
    Restaurant,
    "name" | "isKosher" | "cuisines"
  >[] = [];

  columnsToUpdate.forEach((columnName, index) => {
    setClauseComponents.push(`"${columnName}" = $${index + 2}`);
    setClauseParameters.push(req.body[columnName]);
  });

  try {
    const checkExistenceResponse = await client.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [id]
    );

    if (checkExistenceResponse.rowCount === 0) {
      return res
        .status(404)
        .send("The restaurant with the specified id was not found");
    }

    const query: QueryConfig = {
      text: `
        UPDATE restaurants
        SET ${setClauseComponents.join(", ")}
        WHERE id = $1
      ;`,
      values: [id, ...setClauseParameters],
    };

    await client.query(query);
  } catch (err) {}

  return res.status(200).send();
});

export default router;
