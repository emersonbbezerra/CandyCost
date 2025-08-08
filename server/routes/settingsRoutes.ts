
import { Router } from "express";
import { isAuthenticated } from "../services/userService";

const router = Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    // Retorna configurações básicas do sistema
    res.json({
      systemName: "Sistema de Gestão de Confeitaria",
      version: "1.0.0",
      features: {
        dashboard: true,
        costTracking: true,
        reports: true,
        userManagement: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar configurações" });
  }
});

export default router;
