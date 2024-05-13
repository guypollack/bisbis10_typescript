import { Request, Response, Router } from "express";
import client from "../db/db";
import { QueryConfig } from "pg";
import { validateIdInReqBodyMiddleware } from "../middleware/middleware";

// Handles routes beginning with "/ratings"

const router = Router();

/**
 * POST /ratings
 * Adds a new rating
 */
router.post(
  "/",
  [validateIdInReqBodyMiddleware],
  async (req: Request, res: Response) => {
    try {
      const { restaurantId, rating } = req.body;

      if (typeof rating === "undefined") {
        return res
          .status(400)
          .send("Bad Request. Required properties are missing: rating");
      }

      if (typeof rating !== "number" || rating < 0 || rating > 5) {
        return res
          .status(400)
          .send("Bad Request. rating must be a number between 0 and 5");
      }

      const addRatingQuery: QueryConfig = {
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
      await client.query(addRatingQuery);
      await client.query(updateAverageRatingQuery);
      await client.query("COMMIT");

      return res.status(200).send();
    } catch (err) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .send("Internal Server Error. Unable to add new rating");
    }
  }
);

export default router;
