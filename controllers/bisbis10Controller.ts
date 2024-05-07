import { NextFunction, Request, Response, Router } from "express";
import client from "../db/db";
import { QueryConfig, QueryResult } from "pg";
import { Dish, Restaurant } from "../types/types";
import { roundToDp } from "../lib/helpers/roundToDp";

const router = Router();

const validateIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (
    isNaN(Number.parseInt(id)) ||
    Number.parseInt(id) !== Number.parseFloat(id)
  ) {
    return res
      .status(400)
      .send("Bad Request. Restaurant id must be an integer");
  }

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
  } catch (err) {}

  next();
};

const validateRestaurantReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    isKosher,
    cuisines,
  }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

  const allowedProperties = ["name", "isKosher", "cuisines"];

  if (req.method === "POST") {
    // Check for missing required properties in request body
    const missingPropertiesInRequest = allowedProperties.filter(
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
  }

  // Check for not allowed properties being sent in request body
  const forbiddenProperties = ["id", "averageRating", "dishes"];

  const forbiddenPropertiesInRequest = forbiddenProperties.filter((property) =>
    Object.keys(req.body).includes(property)
  );

  if (forbiddenPropertiesInRequest.length > 0) {
    const requestType =
      req.method === "POST"
        ? "creation request"
        : req.method === "PUT"
        ? "update request"
        : "request";

    return res
      .status(422)
      .send(
        `Unprocessable Entity. The following properties cannot be included in the ${requestType}: ${forbiddenPropertiesInRequest.join(
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

  next();
};

const validateIdInReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { restaurantId } = req.body;

  if (restaurantId === undefined) {
    return res
      .status(400)
      .send("Bad Request. Required properties are missing: restaurantId");
  }

  if (
    isNaN(Number.parseInt(restaurantId)) ||
    Number.parseInt(restaurantId) !== Number.parseFloat(restaurantId)
  ) {
    return res.status(400).send("Bad Request. restaurantId must be an integer");
  }

  try {
    const checkExistenceResponse = await client.query(
      "SELECT * FROM restaurants WHERE id = $1",
      [restaurantId]
    );

    if (checkExistenceResponse.rowCount === 0) {
      return res
        .status(404)
        .send("The restaurant with the specified restaurantId was not found");
    }
  } catch (err) {}

  next();
};

const validateDishReqBodyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    description,
    price,
  }: Pick<Dish, "name" | "description" | "price"> = req.body;

  const allowedProperties = ["name", "description", "price"];

  if (req.method === "POST") {
    // Check for missing required properties in request body
    const missingPropertiesInRequest = allowedProperties.filter(
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
  }

  // Check for not allowed properties being sent in request body
  const forbiddenProperties = ["id"];

  const forbiddenPropertiesInRequest = forbiddenProperties.filter((property) =>
    Object.keys(req.body).includes(property)
  );

  if (forbiddenPropertiesInRequest.length > 0) {
    const requestType =
      req.method === "POST"
        ? "creation request"
        : req.method === "PUT"
        ? "update request"
        : "request";

    return res
      .status(422)
      .send(
        `Unprocessable Entity. The following properties cannot be included in the ${requestType}: ${forbiddenPropertiesInRequest.join(
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

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).send("Bad Request. description must be a string");
  }

  if ((price !== undefined && typeof price !== "number") || price < 0) {
    return res
      .status(400)
      .send("Bad Request. price must be a number greater than or equal to 0");
  }

  next();
};

const validateDishIdParamMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id, dishId } = req.params;

  if (
    isNaN(Number.parseInt(dishId)) ||
    Number.parseInt(dishId) !== Number.parseFloat(dishId)
  ) {
    return res.status(400).send("Bad Request. dishId must be an integer");
  }

  try {
    const getDishesQuery: QueryConfig = {
      text: `
        SELECT dishes
        FROM restaurants
        WHERE id = $1
      ;`,
      values: [id],
    };
    const result: QueryResult<Restaurant> = await client.query(getDishesQuery);
    const dishes = result.rows[0].dishes;

    if (dishes === null || dishes.length === 0) {
      return res
        .status(404)
        .send(
          "The dish with the specified dishId was not found at the restaurant with the specified id"
        );
    }

    const dishIndex = dishes.findIndex((dish) => dish.id === dishId);

    if (dishIndex === -1) {
      return res
        .status(404)
        .send(
          "The dish with the specified dishId was not found at the restaurant with the specified id"
        );
    } else {
      req.body.dishIndex = dishIndex;
    }
  } catch (err) {}

  next();
};

router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to BISBIS10 Server");
});

router.get("/restaurants", async (req: Request, res: Response) => {
  const { cuisine } = req.query;

  let result: QueryResult<Omit<Restaurant, "dishes">>;

  if (cuisine) {
    const query: QueryConfig = {
      text: `
        SELECT id, name, ROUND("averageRating"::numeric, 2), "isKosher", cuisines 
        FROM restaurants 
        WHERE $1 = ANY(cuisines)
        ORDER BY id ASC
        ;`,
      values: [cuisine],
    };
    result = await client.query(query);
  } else {
    result = await client.query(`
      SELECT id, name, ROUND("averageRating"::numeric, 2), "isKosher", cuisines 
      FROM restaurants
      ORDER BY id ASC
      ;`);
  }

  return res.status(200).send(result.rows);
});

router.get(
  "/restaurants/:id",
  [validateIdParamMiddleware],
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const query: QueryConfig = {
        text: `
          SELECT id, name, ROUND("averageRating"::numeric, 2), "isKosher", cuisines, dishes 
          FROM restaurants 
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Restaurant> = await client.query(query);

      return res.status(200).send(result.rows);
    } catch (err) {}
  }
);

router.post(
  "/restaurants",
  [validateRestaurantReqBodyMiddleware],
  async (req: Request, res: Response) => {
    const {
      name,
      isKosher,
      cuisines,
    }: Pick<Restaurant, "name" | "isKosher" | "cuisines"> = req.body;

    try {
      const query: QueryConfig = {
        text: `
          INSERT INTO restaurants (name, "isKosher", cuisines)
          VALUES ($1, $2, $3)
          ;`,
        values: [name, isKosher, cuisines],
      };

      await client.query(query);
    } catch (err) {}

    return res.status(201).send();
  }
);

router.put(
  "/restaurants/:id",
  [validateIdParamMiddleware, validateRestaurantReqBodyMiddleware],
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const allowedProperties = ["name", "isKosher", "cuisines"];

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
  }
);

router.delete(
  "/restaurants/:id",
  [validateIdParamMiddleware],
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const query: QueryConfig = {
        text: "DELETE FROM restaurants WHERE id = $1",
        values: [id],
      };

      await client.query(query);

      return res.status(204).send();
    } catch (err) {}
  }
);

router.post(
  "/ratings",
  [validateIdInReqBodyMiddleware],
  async (req: Request, res: Response) => {
    const { restaurantId, rating } = req.body;

    if (isNaN(Number.parseFloat(rating)) || rating < 0 || rating > 5) {
      return res
        .status(400)
        .send("Bad Request. rating must be a number between 0 and 5");
    }

    try {
      const insertRatingQuery: QueryConfig = {
        text: `
          INSERT INTO ratings ("restaurantId", rating)
          VALUES ($1, $2)
          ;`,
        values: [restaurantId, rating],
      };

      const updateAverageRatingQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET "averageRating" = 
            (
              SELECT AVG(rating)
              FROM ratings
              WHERE "restaurantId" = $1
            )
          WHERE id = $1
          ;`,
        values: [restaurantId],
      };

      await client.query("BEGIN");
      await client.query(insertRatingQuery);
      await client.query(updateAverageRatingQuery);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new rating");
    }
    return res.status(200).send();
  }
);

router.post(
  "/restaurants/:id/dishes",
  [validateIdParamMiddleware, validateDishReqBodyMiddleware],
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const {
      name,
      description,
      price,
    }: Pick<Dish, "name" | "description" | "price"> = req.body;

    try {
      const getDishesQuery: QueryConfig = {
        text: `
          SELECT dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Restaurant> = await client.query(
        getDishesQuery
      );
      const dishes = result.rows[0].dishes;
      const currentDishes = dishes === null ? [] : dishes.slice();

      const lastIdString =
        currentDishes.length === 0
          ? "0"
          : currentDishes[currentDishes.length - 1].id;
      const nextIdString = (parseInt(lastIdString) + 1).toString();

      const newDish = {
        id: nextIdString,
        name,
        description,
        price: roundToDp(price, 2),
      };

      const updateDishesQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET dishes = $1
          WHERE id = $2
          ;`,
        values: [[...currentDishes, newDish], id],
      };

      await client.query(updateDishesQuery);
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new dish");
    }

    return res.status(201).send();
  }
);

router.delete(
  "/restaurants/:id/dishes/:dishId",
  [validateIdParamMiddleware, validateDishIdParamMiddleware],
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const dishIndex: number = req.body.dishIndex;

    try {
      const getDishesQuery: QueryConfig = {
        text: `
          SELECT dishes
          FROM restaurants
          WHERE id = $1
          ;`,
        values: [id],
      };
      const result: QueryResult<Restaurant> = await client.query(
        getDishesQuery
      );
      const dishes = result.rows[0].dishes;

      const updatedDishes = dishes.slice();
      updatedDishes.splice(dishIndex, 1);

      const updateDishesQuery: QueryConfig = {
        text: `
          UPDATE restaurants
          SET dishes = $1
          WHERE id = $2
          ;`,
        values: [updatedDishes, id],
      };

      await client.query(updateDishesQuery);
    } catch (err) {
      return res
        .status(500)
        .send("Internal Server Error. Unable to delete dish");
    }

    return res.status(204).send();
  }
);

export default router;
