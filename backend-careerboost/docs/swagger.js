const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API CareerBoost E-petitpas",
      version: "1.0.0",
      description: "Documentation complète de l'API CareerBoost E-petitpas - Plateforme de matching emploi avec IA",
      contact: {
        name: "Support CareerBoost",
        email: "support@careerboost.com"
      }
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Serveur de développement"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenu via /auth/login"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./routes/*.js", "./controllers/*.js"]
};
 
const swaggerSpec = swaggerJsDoc(options);
 
module.exports = { swaggerUi, swaggerSpec };

 