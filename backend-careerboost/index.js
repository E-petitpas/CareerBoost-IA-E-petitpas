require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { swaggerUi, swaggerSpec } = require("./docs/swagger");

// Import des routes
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const companiesRoutes = require("./routes/companies");
const candidatesRoutes = require("./routes/candidates");
const skillsRoutes = require("./routes/skills");
const jobOffersRoutes = require("./routes/job-offers");
const applicationsRoutes = require("./routes/applications");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/companies", companiesRoutes);
app.use("/candidates", candidatesRoutes);
app.use("/skills", skillsRoutes);
app.use("/job-offers", jobOffersRoutes);
app.use("/applications", applicationsRoutes);
app.use("/admin", adminRoutes);

// Route de base
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API CareerBoost E-petitpas",
    version: "1.0.0",
    documentation: `http://localhost:${PORT}/api-docs`
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    documentation: `http://localhost:${PORT}/api-docs`
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("Erreur globale:", err);
  res.status(500).json({
    error: "Erreur interne du serveur",
    message: process.env.NODE_ENV === "development" ? err.message : "Une erreur est survenue"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur CareerBoost E-petitpas sur http://localhost:${PORT}`);
  console.log(`📖 Documentation Swagger sur http://localhost:${PORT}/api-docs`);
  console.log(`🔧 Environnement: ${process.env.NODE_ENV || "development"}`);
});