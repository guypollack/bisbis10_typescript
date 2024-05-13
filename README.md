# Restaurant Management System

Last edited by Guy Pollack on 13/05/2024

Click [here](#running-the-project) for instructions on how to run the project

## Overview

The bisbis10 restaurant management system is a backend service designed to handle various operations related to restaurants, their dishes, and ratings. The system aims to provide a comprehensive platform for managing restaurant data, including details about the restaurants, their cuisines, dishes, and customer ratings.

## Functionality

The system provides the following APIs:

- **Restaurants API**: Manages restaurant data.
- **Ratings API**: Manages customer ratings for restaurants.
- **Dishes API**: Manages the dishes offered by each restaurant.

## Technical Aspects

The system is built using Express, leveraging its robust framework for creating RESTful APIs. Data persistence can be managed using an in-memory database for simplicity, or a more robust solution like PostgreSQL for production.

## Homework Task

Candidates are expected to design and implement the above APIs, adhering to RESTful principles.

## APIs

### Restaurants APIs

| API Description            | Endpoint                           | Request Body                                                                 | Response Status | Response Body                                                                                                                                                                                     |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Get all restaurants        | GET /restaurants                   |                                                                              | 200 OK          | [{"id": "1","name": "Taizu","averageRating" : 4.83,"isKosher" : false,"cuisines": ["Asian","Mexican","Indian"]}]                                                                                  |
| Get restaurants by cuisine | GET /restaurants?cuisine={cuisine} |                                                                              | 200 OK          | [{"id": "1","name": "averageRating","rating" : 4.83,"isKosher" : false,"cuisines": ["Asian","Mexican","Indian"]}]                                                                                 |
| Get restaurant             | GET /restaurants/{id}              |                                                                              | 200 OK          | {"id": "1","name": "Taizu","averageRating" : 4.83,"isKosher" : false,"cuisines": ["Asian","Mexican","Indian"],"dishes": [{"id": "1","name": "Noodles","description": "Amazing one","price": 59}]} |
| Add a restaurant           | POST /restaurants                  | {"name": "Taizu","isKosher": false,"cuisines": ["Asian","Mexican","Indian"]} | 201 CREATED     |                                                                                                                                                                                                   |
| Update a restaurant        | PUT /restaurants/{id}              | {"cuisines": ["Asian"]}                                                      | 200 OK          |                                                                                                                                                                                                   |
| Delete a restaurant        | DELETE /restaurants/{id}           |                                                                              | 204 No Content  |                                                                                                                                                                                                   |

### Ratings APIs

| API Description         | Endpoint      | Request Body                      | Response Status | Response Body |
| ----------------------- | ------------- | --------------------------------- | --------------- | ------------- |
| Add a restaurant rating | POST /ratings | {"restaurantId": 2, "rating":3.3} | 200 OK          |               |

### Order APIs

| API Description | Endpoint    | Request Body                                                                             | Response Status | Response Body                                    |
| --------------- | ----------- | ---------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------ |
| Order           | POST /order | {"restaurantId": 2, "orderItems":[{"dishId":12,"amount":1},{"dishId":14,"amount":1} ]} ] | 200 OK          | {orderId:"ef401fc8-d545-424b-928d-4789cd47bb6e"} |

### Dishes APIs

| API Description            | Endpoint                                 | Request Body                                               | Response Status | Response Body                                                    |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| Add a dish                 | POST /restaurants/{id}/dishes            | {"name":"Shakshuka","description":"Great one","price": 34} | 201 CREATED     |                                                                  |
| Update a dish              | PUT /restaurants/{id}/dishes/{dishId}    | {"description":"Great one","price": 34}                    | 200 OK          |                                                                  |
| Delete a dish              | DELETE /restaurants/{id}/dishes/{dishId} |                                                            | 204 No Content  |                                                                  |
| Get dishes by a restaurant | GET /restaurants/{id}/dishes             |                                                            | 200 OK          | [{"id":"1","name":"Humus","description":"Good one","price": 48}] |

## Jump Start

For your convenience, docker-compose.yml includes Postgresql DB, the app is already pointing to this connection. In addition, you have the schema and data SQL files that can setup your DB schema and init data.

## Prerequisite

1. Node - https://nodejs.org/en
2. Docker - https://www.docker.com/products/docker-desktop/

## Instructions

1. Fork this repo to your GitHub account.
2. Clone it to your local machine.
3. Complete the task.
4. On completion, send your repo link to the rm-tdpisraelhomework@intl.att.com email, (a snapshot will be taken from your repo once you submit the homework). please do not update your repo after you submit the homework.

## Running the Project

Make sure that you have cloned the project repository to your local machine.

### Using Docker Compose

1. Open a terminal or command prompt and navigate to the project directory.
2. Make sure you have a `docker-compose.yml` file in the root directory.
3. Run the following command to build (if running for the first time) and start the project's PostgreSQL database in a Docker container:
   ```
   docker compose up -d
   ```

### Using TypeScript transpilation and npm start

1. Open a terminal or command prompt and navigate to the project directory.
2. Install dependencies by running:
   ```
    npm install
   ```
3. Transpile TypeScript files by running:
   ```
   tsc
   ```
4. Start the project by running:
   ```
   npm start
   ```

This command will start the project and will log a message in the terminal with the format:
<br>
`Server is on at http://<hostname>:<port>`
<br>
e.g. `Server is On at http://localhost:8000`

Take note of the `hostname` and `port` in order to access the APIs.

### Accessing the APIs

Once the project is running, you can access the APIs provided by the system. By default, they should be available by sending requests to:

`http://<hostname>:<port>/<endpoint>`

Replace `<hostname>` and `<port>` with the actual hostname and port where the application is running, and `<endpoint>` with the specific endpoint you wish to use from the tables above.

You can use tools like cURL, Postman, or your web browser to interact with these APIs.

### Stopping the Docker Container

1. Go to the terminal where you ran the command `docker compose up -d`.
2. Run the following command to stop the container:
   `docker compose down`
